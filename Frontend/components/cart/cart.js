let cart = [];

// Add to cart function
function addToCart() {
  const name = document.querySelector(".product-info h1").innerText;
  const image = document.querySelector(".product-image img").src;
  const description = document.querySelector(".product-description").innerText;
  const price = 250; // You can make this dynamic

  fetch("http://localhost:4000/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: localStorage.getItem("userId") || "demo-user",
      product: { name, price, image, description },
      quantity: 1
    })
  })
  .then(res => res.json())
  .then(() => {
    alert("Added to cart");
    loadCart(); // reload cart after adding
  });
}

// Update quantity in backend (optional)
function updateCartBackend(item) {
  fetch("http://localhost:4000/api/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: localStorage.getItem("userId") || "demo-user",
      product: { name: item.name },
      quantity: item.quantity
    })
  });
}

// Remove from backend (optional)
function removeFromCartBackend(item) {
  const userId = localStorage.getItem("userId") || "demo-user";
  fetch(`http://localhost:4000/api/cart/${userId}/${item.name}`, {
    method: "DELETE"
  })
  .then(res => res.json())
  .then(data => {
    if (!data.success) alert("Failed to remove item");
  });
}

// Render the cart items
// Render the cart items
function renderCart() {
  const cartContainer = document.getElementById("cart-items");
  cartContainer.innerHTML = "";

  cart.forEach(item => {
    const div = document.createElement("div");
    div.className = "cart-item";
    
    div.innerHTML = `
      <div class="item-left">
        <img src="${item.image}" alt="${item.name}">
      </div>

      <div class="item-right">
        <h3 class="item-name">${item.name}</h3>
        <p class="item-price">₹${item.price}</p>

        <div class="quantity">
          <button class="decrease">-</button>
          <span class="qty">${item.quantity}</span>
          <button class="increase">+</button>
        </div>

        <button class="remove">Remove</button>
      </div>
    `;

    cartContainer.appendChild(div);

    // Quantity buttons
    div.querySelector(".increase").addEventListener("click", () => {
      item.quantity += 1;
      div.querySelector(".qty").innerText = item.quantity;
      updateCartBackend(item);
      updatePrice();
    });

    div.querySelector(".decrease").addEventListener("click", () => {
      if (item.quantity > 1) {
        item.quantity -= 1;
        div.querySelector(".qty").innerText = item.quantity;
        updateCartBackend(item);
        updatePrice();
      }
    });

    // Remove button
    div.querySelector(".remove").addEventListener("click", () => {
      cart = cart.filter(i => i !== item);
      div.remove();
      removeFromCartBackend(item);
      updatePrice();
    });
  });

  updatePrice();
}


// Update price details
function updatePrice() {
  let total = 0;
  cart.forEach(item => total += item.price * item.quantity);

  const delivery = 40;
  const subtotalElem = document.getElementById("subtotal");
  const totalElem = document.getElementById("total");

  if (subtotalElem) subtotalElem.innerText = total;
  if (totalElem) totalElem.innerText = total + delivery;
}


// Load cart from backend
function loadCart() {
  const userId = localStorage.getItem("userId") || "demo-user";

  fetch(`http://localhost:4000/api/cart/${userId}`)
    .then(res => res.json())
    .then(data => {
      cart = data.map(item => ({
        name: item.product.name,
        price: item.product.price,
        image: item.product.image.startsWith("http")
          ? item.product.image
          : `http://localhost:4000${item.product.image}`,
        quantity: item.quantity
      }));

      renderCart();
    });
}

document.addEventListener("DOMContentLoaded", () => {
  loadCart();
});

function placeOrder() {
  window.location.href = "checkout.html"; // payment page pe redirect
}
