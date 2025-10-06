const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

/* 1 数据库连接 + 建表（全局单例） */
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('SQLite open error:', err);
    process.exit(1);          // 让 nodemon 崩溃重启，方便你察觉
  }
  console.log('SQLite connected');
});
/* 建产品表 */
db.run(`CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  description TEXT,
  image TEXT,
  category TEXT)`);
/* 建订单表 */
db.run(`CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  products TEXT,
  total REAL,
  discount REAL,
  final_total REAL,
  status TEXT)`);

/* ① 静态文件托管 → 必须最先 */
app.use(express.static(path.join(__dirname, 'public')));

/* ② 请求体解析 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ③ 视图引擎 */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ④ 接口：商品列表  */
app.get('/api/products', (req, res) => {
  const db = new sqlite3.Database('./database.db');   // 临时复用
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
  db.close();
});

 /* 5 路由开始（全部用同一个 db）*/
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.render('products', { products: rows, lang: req.query.lang || 'en' });
  });
});

/* 6 其余路由（admin/cart/checkout）照抄即可，全部用全局 db */
app.get('/admin', (req, res) => res.render('admin'));
app.post('/admin/add-product', (req, res) => {
  const { name, price, description, image, category } = req.body;
  db.run(`INSERT INTO products (name,price,description,image,category) VALUES (?,?,?,?,?)`,
    [name, parseFloat(price), description, image || '/images/default.jpg', category],
    function (err) {
      if (err) return res.status(500).send(err.message);
      res.redirect('/');
    });
});

app.get('/cart', (req, res) => res.render('cart', { lang: req.query.lang || 'en' }));
app.get('/checkout', (req, res) => res.render('checkout', { lang: req.query.lang || 'en' }));

app.post('/checkout', (req, res) => {
  const { products, total, discountCode } = req.body;
  let discount = 0;
  if (discountCode === 'DISCOUNT10') discount = total * 0.1;
  const finalTotal = total - discount;
  db.run(`INSERT INTO orders (products,total,discount,final_total,status) VALUES (?,?,?,?,?)`,
    [JSON.stringify(products), total, discount, finalTotal, 'paid'],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: 'Payment successful! Order placed.' });
    });
});


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

/* 7 兜底 404 */
app.use((req, res) => res.status(404).send('404 Not Found'));

/* 8 启动监听 */
app.listen(PORT, () => {
  console.log(`[OK] Server listening → http://localhost:${PORT}`);
});