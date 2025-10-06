const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');
const goods = [
  {n:'T恤',   p:99,  d:'纯棉',  i:'/images/clothing.jpg', c:'服装'},
  {n:'手机',  p:1999,d:'5G',    i:'/images/phone.jpg',    c:'电子'},
  {n:'牛仔裤',p:199, d:'修身',  i:'/images/jeans.jpg',    c:'服装'}
];
const stmt = db.prepare(`INSERT INTO products (name,price,description,image,category) VALUES (?,?,?,?,?)`);
goods.forEach(g=>stmt.run(g.n,g.p,g.d,g.i,g.c));
stmt.finalize(()=>console.log('分类数据已插入'), db.close());