import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new sqlite3.Database(join(__dirname, '../../godeo.db'));

db.serialize(() => {
  // Usuarios
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'EMPLEADO',
    restaurant TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Productos
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    stock REAL,
    unit TEXT,
    price REAL,
    min_stock REAL DEFAULT 10,
    expiry_date TEXT,
    restaurant TEXT,
    image TEXT,
    barcode TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, restaurant)
  )`);

  // Movimientos
  db.run(`CREATE TABLE IF NOT EXISTS movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    quantity REAL,
    reason TEXT,
    product_id INTEGER,
    user_id INTEGER,
    supplier_id INTEGER,
    restaurant TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Transferencias
  db.run(`CREATE TABLE IF NOT EXISTS transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    quantity REAL,
    from_restaurant TEXT,
    to_restaurant TEXT,
    user_id INTEGER,
    reason TEXT,
    status TEXT DEFAULT 'pendiente',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
  )`);

  // Solicitudes/Pedidos
  db.run(`CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT,
    quantity REAL,
    unit TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pendiente',
    user_id INTEGER,
    restaurant TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Crear admin
  const hash = bcrypt.hashSync('Godeo2024', 10);
  db.run(`INSERT OR IGNORE INTO users (email, password, name, role, restaurant) 
           VALUES ('admin@godeo.com', ?, 'Administrador', 'ADMIN', 'POZOBLANCO')`, [hash]);
  
  // Crear empleados de prueba
  db.run(`INSERT OR IGNORE INTO users (email, password, name, role, restaurant) 
           VALUES ('empleado1@godeo.com', ?, 'Carlos Pérez', 'EMPLEADO', 'POZOBLANCO')`, [hash]);
  db.run(`INSERT OR IGNORE INTO users (email, password, name, role, restaurant) 
           VALUES ('empleado2@godeo.com', ?, 'Ana López', 'EMPLEADO', 'FUERTEVENTURA')`, [hash]);
  db.run(`INSERT OR IGNORE INTO users (email, password, name, role, restaurant) 
           VALUES ('empleado3@godeo.com', ?, 'Luis García', 'EMPLEADO', 'GRAN_CAPITAN')`, [hash]);
  
  console.log('✅ Base de datos inicializada');
});

db.close();
