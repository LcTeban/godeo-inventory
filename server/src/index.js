import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();
const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new sqlite3.Database(join(__dirname, '../../godeo.db'));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(__dirname, '../../client/dist')));

// Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  
  jwt.verify(token, process.env.JWT_SECRET || 'godeo2024', (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// LOGIN
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Credenciales inválidas' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, restaurant: user.restaurant },
      process.env.JWT_SECRET || 'godeo2024'
    );
    
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, restaurant: user.restaurant } });
  });
});

// PRODUCTOS
app.get('/api/:restaurant/products', authenticateToken, (req, res) => {
  db.all('SELECT * FROM products WHERE restaurant = ? ORDER BY name', [req.params.restaurant], (err, rows) => {
    res.json(rows || []);
  });
});

app.post('/api/:restaurant/products', authenticateToken, (req, res) => {
  const { name, category, stock, unit, min_stock, expiry_date, image, barcode } = req.body;
  db.run(
    'INSERT INTO products (name, category, stock, unit, min_stock, expiry_date, restaurant, image, barcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, category, stock || 0, unit || 'unidad', min_stock || 10, expiry_date, req.params.restaurant, image, barcode],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, ...req.body });
    }
  );
});

app.put('/api/:restaurant/products/:id', authenticateToken, (req, res) => {
  const { name, category, stock, unit, min_stock, expiry_date, image, barcode } = req.body;
  db.run(
    'UPDATE products SET name=?, category=?, stock=?, unit=?, min_stock=?, expiry_date=?, image=?, barcode=? WHERE id=?',
    [name, category, stock, unit, min_stock, expiry_date, image, barcode, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: req.params.id, ...req.body });
    }
  );
});

app.delete('/api/:restaurant/products/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Eliminado' });
  });
});

// MOVIMIENTOS
app.get('/api/:restaurant/movements', authenticateToken, (req, res) => {
  db.all(
    `SELECT m.*, p.name as product_name, u.name as user_name 
     FROM movements m 
     LEFT JOIN products p ON m.product_id = p.id 
     LEFT JOIN users u ON m.user_id = u.id 
     WHERE m.restaurant = ? 
     ORDER BY m.created_at DESC LIMIT 100`,
    [req.params.restaurant],
    (err, rows) => res.json(rows || [])
  );
});

app.post('/api/:restaurant/movements', authenticateToken, (req, res) => {
  const { type, quantity, reason, productId } = req.body;
  
  db.get('SELECT stock FROM products WHERE id = ?', [productId], (err, product) => {
    if (err || !product) return res.status(404).json({ error: 'Producto no encontrado' });
    
    let newStock = product.stock;
    if (type === 'entrada') newStock += parseFloat(quantity);
    else if (type === 'salida') {
      if (product.stock < quantity) return res.status(400).json({ error: 'Stock insuficiente' });
      newStock -= parseFloat(quantity);
    }
    
    db.run(
      'INSERT INTO movements (type, quantity, reason, product_id, user_id, restaurant) VALUES (?, ?, ?, ?, ?, ?)',
      [type, quantity, reason, productId, req.user.id, req.params.restaurant],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.run('UPDATE products SET stock = ? WHERE id = ?', [newStock, productId]);
        res.json({ id: this.lastID });
      }
    );
  });
});

// DASHBOARD
app.get('/api/dashboard/overview', authenticateToken, (req, res) => {
  const restaurants = ['POZOBLANCO', 'FUERTEVENTURA', 'GRAN_CAPITAN'];
  const stats = {};
  let completed = 0;
  
  restaurants.forEach(rest => {
    db.get('SELECT COUNT(*) as count FROM products WHERE restaurant = ?', [rest], (err, row) => {
      stats[rest] = { totalProducts: row?.count || 0, inventoryValue: 0, lowStock: 0 };
      completed++;
      if (completed === 3) {
        db.get('SELECT COUNT(*) as count FROM transfers WHERE status = "pendiente"', (e, r) => {
          res.json({ restaurants: stats, pendingTransfers: r?.count || 0 });
        });
      }
    });
  });
});

// TRANSFERENCIAS
app.get('/api/transfers', authenticateToken, (req, res) => {
  db.all(
    `SELECT t.*, p.name as product_name, u.name as user_name 
     FROM transfers t 
     LEFT JOIN products p ON t.product_id = p.id 
     LEFT JOIN users u ON t.user_id = u.id 
     ORDER BY t.created_at DESC`,
    (err, rows) => res.json(rows || [])
  );
});

app.post('/api/transfers', authenticateToken, (req, res) => {
  const { productId, quantity, toRestaurant, reason } = req.body;
  db.run(
    'INSERT INTO transfers (product_id, quantity, from_restaurant, to_restaurant, user_id, reason) VALUES (?, ?, ?, ?, ?, ?)',
    [productId, quantity, req.user.restaurant, toRestaurant, req.user.id, reason],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.post('/api/transfers/:id/complete', authenticateToken, (req, res) => {
  const transferId = req.params.id;
  
  db.get('SELECT * FROM transfers WHERE id = ?', [transferId], (err, transfer) => {
    if (err || !transfer) return res.status(404).json({ error: 'Transferencia no encontrada' });
    
    db.get('SELECT * FROM products WHERE id = ?', [transfer.product_id], (err, product) => {
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      
      // Buscar o crear producto en destino
      db.get('SELECT * FROM products WHERE name = ? AND restaurant = ?', [product.name, transfer.to_restaurant], (err, destProduct) => {
        if (destProduct) {
          db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [transfer.quantity, destProduct.id]);
        } else {
          db.run(
            'INSERT INTO products (name, category, stock, unit, min_stock, restaurant) VALUES (?, ?, ?, ?, ?, ?)',
            [product.name, product.category, transfer.quantity, product.unit, product.min_stock, transfer.to_restaurant]
          );
        }
        
        db.run('UPDATE transfers SET status = "completado", completed_at = datetime("now") WHERE id = ?', [transferId]);
        res.json({ success: true });
      });
    });
  });
});

// SOLICITUDES
app.get('/api/requests', authenticateToken, (req, res) => {
  db.all(
    `SELECT r.*, u.name as user_name 
     FROM requests r 
     LEFT JOIN users u ON r.user_id = u.id 
     ORDER BY r.created_at DESC`,
    (err, rows) => res.json(rows || [])
  );
});

app.post('/api/requests', authenticateToken, (req, res) => {
  const { productName, quantity, unit, notes } = req.body;
  db.run(
    'INSERT INTO requests (product_name, quantity, unit, notes, user_id, restaurant) VALUES (?, ?, ?, ?, ?, ?)',
    [productName, quantity, unit, notes, req.user.id, req.user.restaurant],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.put('/api/requests/:id', authenticateToken, (req, res) => {
  const { status } = req.body;
  db.run('UPDATE requests SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../../client/dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Godeo en puerto ${PORT}`));
