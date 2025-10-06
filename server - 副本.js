const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 3000;

// 中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // 静态文件
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 数据库初始化
let db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    return; // 阻止后续执行
  }
  console.log('Connected to the SQLite database.');
});
db.all('SELECT * FROM products', [], (err, rows) => {
  if (err) throw err;
  rows.forEach(row => {
    row.id = parseInt(row.id); // 确保 id 为整数
    row.price = parseFloat(row.price); // 确保 price 为浮点数
  });
  res.render('products', { products: rows, lang: req.query.lang || 'en' });
});

// 创建产品表（如果不存在）
db.run(`CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  description TEXT,
  image TEXT,
  category TEXT
)`);

// 创建订单表（简单模拟）
db.run(`CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  products TEXT,
  total REAL,
  discount REAL,
  final_total REAL,
  status TEXT
)`);

// 主页 - 产品列表
app.get('/', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) throw err;
    res.render('products', { products: rows, lang: req.query.lang || 'en' }); // 支持语言切换
  });
});

// 管理员页面 - 上架产品
app.get('/admin', (req, res) => {
  res.render('admin');
});

app.post('/admin/add-product', (req, res) => {
  const { name, price, description, image, category } = req.body;
  db.run(`INSERT INTO products (name, price, description, image, category) VALUES (?, ?, ?, ?, ?)`,
    [name, parseFloat(price), description, image, category],
    (err) => {
      if (err) throw err;
      res.redirect('/');
    });
});

// 购物车页面（前端JS管理购物车，后端只渲染）
app.get('/cart', (req, res) => {
  res.render('cart', { lang: req.query.lang || 'en' });
});

// 结账页面
app.get('/checkout', (req, res) => {
  res.render('checkout', { lang: req.query.lang || 'en' });
});

// 处理结账（模拟支付）
app.post('/checkout', (req, res) => {
  const { products, total, discountCode } = req.body;
  let discount = 0;
  if (discountCode === 'DISCOUNT10') discount = total * 0.1;
  const finalTotal = total - discount;

  // 插入订单
  db.run(`INSERT INTO orders (products, total, discount, final_total, status) VALUES (?, ?, ?, ?, ?)`,
    [JSON.stringify(products), total, discount, finalTotal, 'paid'],
    (err) => {
      if (err) throw err;
      res.json({ success: true, message: 'Payment successful! Order placed.' });
    });
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});