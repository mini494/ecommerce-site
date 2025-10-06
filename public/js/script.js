let cart = JSON.parse(localStorage.getItem('cart')) || [];

// 添加到购物车
function addToCart(id, name, price) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, name, price, quantity: 1 });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  alert('Added to cart!');
}

// 显示购物车
function displayCart() {
  const cartItems = document.getElementById('cart-items');
  if (cartItems) {
    cartItems.innerHTML = '';
    cart.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `${item.name} - $${item.price} x ${item.quantity} <button onclick="removeFromCart(${item.id})">Remove</button>`;
      cartItems.appendChild(li);
    });
    calculateTotal();
  }
}

// 移除
function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  localStorage.setItem('cart', JSON.stringify(cart));
  displayCart();
}

// 计算总价
function calculateTotal() {
  const totalElem = document.getElementById('total');
  if (totalElem) {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    totalElem.textContent = total.toFixed(2);
  }
}

// 应用折扣
function applyDiscount() {
  const code = document.getElementById('discountCode').value;
  calculateTotal(); // 先计算总价
  // 折扣逻辑在后端处理，这里只提示
  alert('Discount code applied (processed on server).');
}

// 处理支付
function processPayment() {
  const total = parseFloat(document.getElementById('total').textContent);
  const discountCode = document.getElementById('discountCode').value;
  fetch('/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products: cart, total, discountCode })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert(data.message);
      localStorage.removeItem('cart');
      window.location.href = '/';
    }
  });
}