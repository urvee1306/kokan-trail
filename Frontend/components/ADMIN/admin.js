// Load all orders
fetch("http://localhost:4000/api/admin/orders")
  .then(res => res.json())
  .then(data => {
    const tbody = document.querySelector("tbody");
    tbody.innerHTML = "";

    data.forEach(order => {
      tbody.innerHTML += `
        <tr>
          <td>${order.orderId}</td>
          <td>${order.userName}</td>
          <td>₹${order.amount}</td>
          <td>
            ${order.paymentScreenshot 
              ? `<a href="${order.paymentScreenshot}" target="_blank">View</a>`
              : "Not uploaded"}
          </td>
          <td>${order.paymentStatus}</td>
          <td>
            <select onchange="updateStatus('${order.orderId}', this.value)">
              <option ${order.orderStatus==="Pending"?"selected":""}>Pending</option>
              <option ${order.orderStatus==="Confirmed"?"selected":""}>Confirmed</option>
              <option ${order.orderStatus==="Packed"?"selected":""}>Packed</option>
              <option ${order.orderStatus==="Shipped"?"selected":""}>Shipped</option>
              <option ${order.orderStatus==="Delivered"?"selected":""}>Delivered</option>
            </select>
          </td>
          <td>
            <button onclick="approve('${order.orderId}')">Approve</button>
            <button onclick="reject('${order.orderId}')">Reject</button>
          </td>
        </tr>
      `;
    });
  });

// Approve payment
function approve(orderId) {
  fetch(`http://localhost:4000/api/admin/approve/${orderId}`, {
    method: "PUT"
  })
  .then(res => res.json())
  .then(() => location.reload());
}

// Reject payment
function reject(orderId) {
  fetch(`http://localhost:4000/api/admin/reject/${orderId}`, {
    method: "PUT"
  })
  .then(res => res.json())
  .then(() => location.reload());
}

// Update order status
function updateStatus(orderId, status) {
  fetch(`http://localhost:4000/api/admin/status/${orderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderStatus: status })
  });
}
