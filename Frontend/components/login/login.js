async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const messageBox = document.getElementById("message");

  try {
    const res = await fetch("http://localhost:4000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.success) {
      // 🔥 THIS WAS MISSING / NOT RUNNING
      localStorage.setItem("userId", data.userId);

      console.log("SAVED USER ID:", data.userId);

      messageBox.style.color = "green";
      messageBox.textContent = "Login successful";

      // redirect
      window.location.href = "../homepage/homepage.html";
    } else {
      messageBox.style.color = "red";
      messageBox.textContent = data.message;
    }
  } catch (err) {
    console.error(err);
    messageBox.textContent = "Server error";
  }
}
