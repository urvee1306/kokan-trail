// 1️⃣ URL se productId nikalna
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

if (!productId) {
  document.querySelector("#product-name").textContent = "Invalid product";
  throw new Error("Product ID missing in URL");
}

// 2️⃣ Backend API call
fetch(`http://localhost:4000/api/products/${productId}`)
  .then(res => res.json())
  .then(product => {
    if(product) {
      document.querySelector("#product-name").textContent = product.name;
      document.querySelector("#product-price").textContent = "₹" + product.price;
      document.querySelector("#product-img").src =  `http://localhost:4000${product.image}`;
    } else {
      document.querySelector("#product-name").textContent = "Product not found";
    }
  })
  .catch(err => console.error(err));

  // ===============================
// ADD TO CART FROM PRODUCT PAGE
// ===============================
document.getElementById("add-to-cart-btn")?.addEventListener("click", () => {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    alert("Please login first");
    return;
  }

  fetch("http://localhost:4000/api/cart/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      productId,   // 🔥 URL se mila hua id
      quantity: 1
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert("Added to cart");
    } else {
      alert("Failed to add to cart");
    }
  })
  .catch(err => console.error(err));
});


document.querySelector("#product-img").src =
  `http://localhost:4000${product.image}`;
function addToCart() {
  const cartData = {
    userId: "123", // logged-in user id (static for now)
    product: {
      name: document.querySelector("#product-name").innerText,
      price: Number(document.querySelector("#product-price").innerText),
      image: document.querySelector("#product-image").src,
      description: document.querySelector("#product-desc").innerText
    },
    quantity: 1
  };

  fetch("http://localhost:4000/api/cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(cartData)
  })
  .then(res => res.json())
  .then(data => {
    alert("Product added to cart");
  })
  .catch(err => console.error(err));
}
