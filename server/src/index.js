import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();
const app = express();
const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());

// Middleware de autenticación
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
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, restaurant: user.restaurant },
      process.env.JWT_SECRET || 'godeo2024'
    );
    
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, restaurant: user.restaurant } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PRODUCTOS POR RESTAURANTE
app.get('/api/:restaurant/products', authenticateToken, async (req, res) => {
  const products = await prisma.product.findMany({
    where: { restaurant: req.params.restaurant },
    orderBy: { name: 'asc' }
  });
  res.json(products);
});

app.post('/api/:restaurant/products', authenticateToken, async (req, res) => {
  const { name, category, stock, unit, price, minStock } = req.body;
  const product = await prisma.product.create({
    data: {
      name, category,
      stock: parseFloat(stock),
      unit,
      price: parseFloat(price),
      minStock: parseFloat(minStock) || 10,
      restaurant: req.params.restaurant
    }
  });
  res.json(product);
});

app.put('/api/:restaurant/products/:id', authenticateToken, async (req, res) => {
  const { name, category, stock, unit, price, minStock } = req.body;
  const product = await prisma.product.update({
    where: { id: parseInt(req.params.id) },
    data: { name, category, stock: parseFloat(stock), unit, price: parseFloat(price), minStock: parseFloat(minStock) }
  });
  res.json(product);
});

app.delete('/api/:restaurant/products/:id', authenticateToken, async (req, res) => {
  await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ message: 'Producto eliminado' });
});

// MOVIMIENTOS
app.get('/api/:restaurant/movements', authenticateToken, async (req, res) => {
  const movements = await prisma.movement.findMany({
    where: { restaurant: req.params.restaurant },
    include: { product: true, user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  res.json(movements);
});

app.post('/api/:restaurant/movements', authenticateToken, async (req, res) => {
  const { type, quantity, reason, productId } = req.body;
  const product = await prisma.product.findFirst({
    where: { id: productId, restaurant: req.params.restaurant }
  });
  
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  
  let newStock = product.stock;
  if (type === 'entrada') newStock += parseFloat(quantity);
  else if (type === 'salida') {
    if (product.stock < quantity) return res.status(400).json({ error: 'Stock insuficiente' });
    newStock -= parseFloat(quantity);
  }
  
  const movement = await prisma.$transaction(async (tx) => {
    const mov = await tx.movement.create({
      data: {
        type, quantity: parseFloat(quantity), reason, productId,
        userId: req.user.id, restaurant: req.params.restaurant
      }
    });
    await tx.product.update({ where: { id: productId }, data: { stock: newStock } });
    return mov;
  });
  
  res.json(movement);
});

// TRANSFERENCIAS
app.get('/api/transfers', authenticateToken, async (req, res) => {
  const transfers = await prisma.transfer.findMany({
    include: { product: true, user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(transfers);
});

app.post('/api/transfers', authenticateToken, async (req, res) => {
  const { productId, quantity, toRestaurant, reason } = req.body;
  const fromRestaurant = req.user.restaurant;
  
  const product = await prisma.product.findFirst({
    where: { id: productId, restaurant: fromRestaurant }
  });
  
  if (!product || product.stock < quantity) {
    return res.status(400).json({ error: 'Stock insuficiente' });
  }
  
  const transfer = await prisma.$transaction(async (tx) => {
    const trans = await tx.transfer.create({
      data: {
        productId, quantity: parseFloat(quantity),
        fromRestaurant, toRestaurant, userId: req.user.id, reason
      }
    });
    
    await tx.product.update({
      where: { id: productId },
      data: { stock: { decrement: parseFloat(quantity) } }
    });
    
    await tx.movement.create({
      data: {
        type: 'salida', quantity: parseFloat(quantity),
        reason: `Transferencia a ${toRestaurant}`,
        productId, userId: req.user.id, restaurant: fromRestaurant
      }
    });
    
    return trans;
  });
  
  res.json(transfer);
});

app.post('/api/transfers/:id/complete', authenticateToken, async (req, res) => {
  const transfer = await prisma.transfer.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { product: true }
  });
  
  if (!transfer) return res.status(404).json({ error: 'Transferencia no encontrada' });
  
  await prisma.$transaction(async (tx) => {
    let destProduct = await tx.product.findFirst({
      where: { name: transfer.product.name, restaurant: transfer.toRestaurant }
    });
    
    if (!destProduct) {
      destProduct = await tx.product.create({
        data: {
          name: transfer.product.name, category: transfer.product.category,
          stock: 0, unit: transfer.product.unit, price: transfer.product.price,
          minStock: transfer.product.minStock, restaurant: transfer.toRestaurant
        }
      });
    }
    
    await tx.product.update({
      where: { id: destProduct.id },
      data: { stock: { increment: transfer.quantity } }
    });
    
    await tx.movement.create({
      data: {
        type: 'entrada', quantity: transfer.quantity,
        reason: `Transferencia desde ${transfer.fromRestaurant}`,
        productId: destProduct.id, userId: req.user.id, restaurant: transfer.toRestaurant
      }
    });
    
    await tx.transfer.update({
      where: { id: transfer.id },
      data: { status: 'completado', completedAt: new Date() }
    });
  });
  
  res.json({ message: 'Transferencia completada' });
});

// DASHBOARD
app.get('/api/dashboard/overview', authenticateToken, async (req, res) => {
  const restaurants = ['POZOBLANCO', 'FUERTEVENTURA', 'GRAN_CAPITAN'];
  const stats = {};
  
  for (const restaurant of restaurants) {
    const products = await prisma.product.findMany({ where: { restaurant } });
    stats[restaurant] = {
      totalProducts: products.length,
      inventoryValue: products.reduce((sum, p) => sum + (p.stock * p.price), 0),
      lowStock: products.filter(p => p.stock <= p.minStock).length
    };
  }
  
  const pendingTransfers = await prisma.transfer.count({ where: { status: 'pendiente' } });
  res.json({ restaurants: stats, pendingTransfers });
});

// PROVEEDORES
app.get('/api/suppliers', authenticateToken, async (req, res) => {
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
  res.json(suppliers);
});

app.post('/api/suppliers', authenticateToken, async (req, res) => {
  const { name, contact, phone, email, address } = req.body;
  const supplier = await prisma.supplier.create({ data: { name, contact, phone, email, address } });
  res.json(supplier);
});

// INICIALIZACIÓN
async function initialize() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@godeo.com' } });
  if (!admin) {
    const hashedPassword = await bcrypt.hash('Godeo2024', 10);
    await prisma.user.create({
      data: {
        email: 'admin@godeo.com',
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN',
        restaurant: 'POZOBLANCO'
      }
    });
    console.log('✅ Admin creado: admin@godeo.com / Godeo2024');
  }
}

// INICIAR SERVIDOR
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await initialize();
  console.log(`🚀 Godeo Inventory - Puerto ${PORT}`);
  console.log(`📍 Pozoblanco | Fuerteventura | Gran Capitán`);
});
