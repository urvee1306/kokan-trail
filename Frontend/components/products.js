// Backend se products fetch karo
fetch("http://localhost:4000/api/products")
  .then(res => res.json())
  .then(products => {
    const grid = document.querySelector(".products-grid");

    products.forEach(product => {
      grid.innerHTML += `
        <div class="product-card">
          <img src="${product.image}">
          <h2>${product.name}</h2>
          <p>₹${product.price}</p>
          <a href="product.html?id=${product._id}" class="order-btn">
            View Product
          </a>
        </div>
      `;
    });
  });



// Event delegation for all buttons
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("order-btn")) {
    const productId = e.target.dataset.id;
    if (!productId) return alert("Product ID missing!");
    window.location.href = `product.html?id=${productId}`;
  }
});

document.querySelector("#product-img").src =
  `http://localhost:4000${product.image}`;
