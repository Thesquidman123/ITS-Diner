const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('./burger_van.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  // Menu items table
  db.run(`CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    available BOOLEAN DEFAULT 1,
    image_url TEXT
  )`);

  // Orders table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Order items table
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
  )`);

  // Insert sample menu items
  const sampleItems = [
    { name: 'Classic Burger', description: 'Beef patty with lettuce, tomato, onion', price: 8.99, category: 'burgers' },
    { name: 'Cheese Burger', description: 'Beef patty with cheese, lettuce, tomato', price: 9.99, category: 'burgers' },
    { name: 'Bacon Burger', description: 'Beef patty with bacon, cheese, lettuce', price: 10.99, category: 'burgers' },
    { name: 'Veggie Burger', description: 'Plant-based patty with vegetables', price: 8.99, category: 'burgers' },
    { name: 'Regular Fries', description: 'Crispy golden fries', price: 3.99, category: 'sides' },
    { name: 'Large Fries', description: 'Extra large portion of fries', price: 5.99, category: 'sides' },
    { name: 'Onion Rings', description: 'Crispy breaded onion rings', price: 4.99, category: 'sides' },
    { name: 'Coca Cola', description: 'Refreshing cola drink', price: 2.99, category: 'drinks' },
    { name: 'Lemonade', description: 'Fresh squeezed lemonade', price: 3.49, category: 'drinks' },
    { name: 'Water', description: 'Bottled spring water', price: 1.99, category: 'drinks' }
  ];

  sampleItems.forEach(item => {
    db.run(`INSERT OR IGNORE INTO menu_items (name, description, price, category) VALUES (?, ?, ?, ?)`,
      [item.name, item.description, item.price, item.category]);
  });
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// API Routes

// Get all menu items
app.get('/api/menu', (req, res) => {
  db.all('SELECT * FROM menu_items WHERE available = 1 ORDER BY category, name', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create new order
app.post('/api/orders', (req, res) => {
  const { customer_name, customer_email, customer_phone, items } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }

  const orderId = uuidv4();
  let totalAmount = 0;

  // Calculate total amount
  items.forEach(item => {
    totalAmount += item.price * item.quantity;
  });

  // Insert order
  db.run(`INSERT INTO orders (id, customer_name, customer_email, customer_phone, total_amount) 
          VALUES (?, ?, ?, ?, ?)`,
    [orderId, customer_name, customer_email, customer_phone, totalAmount],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Insert order items
      const insertItem = db.prepare(`INSERT INTO order_items (order_id, menu_item_id, quantity, price) 
                                     VALUES (?, ?, ?, ?)`);
      
      items.forEach(item => {
        insertItem.run([orderId, item.menu_item_id, item.quantity, item.price]);
      });
      
      insertItem.finalize();

      // Emit new order to staff dashboard
      io.emit('new_order', {
        id: orderId,
        customer_name,
        total_amount: totalAmount,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      res.json({
        id: orderId,
        customer_name,
        customer_email,
        customer_phone,
        total_amount: totalAmount,
        status: 'pending',
        payment_status: 'pending'
      });
    }
  );
});

// Get all orders for staff dashboard
app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY created_at DESC', (err, orders) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Get order items for each order
    const ordersWithItems = orders.map(order => {
      return new Promise((resolve) => {
        db.all('SELECT oi.*, mi.name FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE oi.order_id = ?',
          [order.id], (err, items) => {
            resolve({ ...order, items: items || [] });
          });
        });
    });

    Promise.all(ordersWithItems).then(results => {
      res.json(results);
    });
  });
});

// Update order status
app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'confirmed', 'preparing', 'ready', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Emit status update
      io.emit('order_status_update', { id, status });
      
      res.json({ id, status });
    }
  );
});

// Mock payment endpoint
app.post('/api/payments', (req, res) => {
  const { order_id, payment_method } = req.body;
  
  // Simulate payment processing
  setTimeout(() => {
    db.run('UPDATE orders SET payment_status = ? WHERE id = ?',
      ['completed', order_id], (err) => {
        if (err) {
          console.error('Payment update error:', err);
          return;
        }
        
        // Emit payment completion
        io.emit('payment_completed', { order_id });
      });
  }, 2000);

  res.json({ 
    success: true, 
    message: 'Payment processing initiated',
    order_id 
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
