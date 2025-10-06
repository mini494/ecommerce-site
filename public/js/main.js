// 请求后端接口 → 渲染列表
fetch('/api/products')
  .then(res => res.json())
  .then(data => {
    const html = data.map(p => `<li>${p.name} - ¥${p.price}</li>`).join('');
    document.getElementById('list').innerHTML = html;
  })
  .catch(err => console.error(err));