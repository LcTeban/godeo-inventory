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
app.use(express.json());
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
  const { name, category, stock, unit, price, minStock } = req.body;
  db.run(
    'INSERT INTO products (name, category, stock, unit, price, min_stock, restaurant) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, category, stock || 0, unit || 'unidad', price || 0, minStock || 10, req.params.restaurant],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, ...req.body });
    }
  );
});

app.put('/api/:restaurant/products/:id', authenticateToken, (req, res) => {
  const { name, category, stock, unit, price, minStock } = req.body;
  db.run(
    'UPDATE products SET name=?, category=?, stock=?, unit=?, price=?, min_stock=? WHERE id=?',
    [name, category, stock, unit, price, minStock, req.params.id],
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
     ORDER BY m.created_at DESC LIMIT 50`,
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
  let pending = 0;
  
  restaurants.forEach(rest => {
    db.get('SELECT COUNT(*) as count FROM products WHERE restaurant = ?', [rest], (err, row) => {
      stats[rest] = { totalProducts: row?.count || 0, inventoryValue: 0, lowStock: 0 };
      if (Object.keys(stats).length === 3) {
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

// PROVEEDORES
app.get('/api/suppliers', authenticateToken, (req, res) => {
  db.all('SELECT * FROM suppliers ORDER BY name', (err, rows) => res.json(rows || []));
});

app.post('/api/suppliers', authenticateToken, (req, res) => {
  const { name, contact, phone, email, address } = req.body;
  db.run(
    'INSERT INTO suppliers (name, contact, phone, email, address) VALUES (?, ?, ?, ?, ?)',
    [name, contact, phone, email, address],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../../client/dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Godeo en puerto ${PORT}`));
