require("dotenv").config();
const connectDB = require("./db");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const multer = require('multer');
const fs =require('fs');
const path = require("path");
const uploadDir = path.join(__dirname, "uploads");

const User = require("./models/user");
const Order = require('./models/order');
const Product = require("./models/product");
const Cart = require("./models/cart");


const app = express();
app.use(express.json());
app.use(cors());


// Serve static frontend files
app.use(express.static(path.join(__dirname, "frontend")));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
// app.use("/uploads", express.static(uploadDir));

//  Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log(" MongoDB connected"))
  .catch((err) => console.error("! MongoDB error:", err));

//multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({storage});

// helper orderId generator
function generateOrderId() {
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.floor(1000 + Math.random()*9000);
  return `KM${date}-${rand}`;
}

// Register API
app.post("/register", async (req, res) => {
  const { fullname, email, username, password } = req.body;

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    return res.json({ success: false, message: "Username or Email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ fullname, email, username, password: hashedPassword });
  await newUser.save();

  res.json({ success: true, message: "Registration successful" });
});

// Login API
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.json({ success: false, message: "User not found" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.json({ success: false, message: "Invalid password" });
  }

  // 🔥 YAHI MAIN LINE HAI
  res.json({
    success: true,
    message: "Login successful",
    userId: user._id   // 👈 MongoDB se real ID
  });
});


// Get all products
app.get('/api/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// server.js / routes.js
app.get("/api/products/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  res.json(product);
});



// // Get single product (product detail page)
// app.get('/api/products/:id', async (req, res) => {
//   const product = await Product.findById(req.params.id);
//   res.json(product);
// });


// app.post("/api/cart", async (req, res) => {
//   try {
//     const cartItem = new Cart(req.body);
//     await cartItem.save();
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ success: false });
//   }
// });

app.post("/api/cart", async (req, res) => {
  try {
    const { userId, product, quantity } = req.body;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ product, quantity }]
      });
    } else {
      cart.items.push({ product, quantity });
    }

    await cart.save();
    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// Cart model assumed: { userId, product: { name, price, image }, quantity }

app.delete("/api/cart/:userId/:productName", async (req, res) => {
  try {
    const { userId, productName } = req.params;

    // Delete the cart item for this user
    await Cart.findOneAndDelete({ 
      userId: userId, 
      "product.name": productName 
    });

    res.json({ success: true, message: "Item removed from cart" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// app.post("/api/cart/add", async (req, res) => {
//   try {
//     const { userId, productId } = req.body;
//     const quantity = Number(req.body.quantity) || 1;

//     let cart = await Cart.findOne({ userId });

//     if (!cart) {
//       cart = new Cart({
//         userId,
//         items: [{ productId, quantity }]
//       });
//     } else {
//       const index = cart.items.findIndex(
//         item => item.productId.toString() === productId
//       );

//       if (index > -1) {
//         cart.items[index].quantity += quantity;
//       } else {
//         cart.items.push({ productId, quantity });
//       }
//     }

//     await cart.save();
//     res.json({ success: true });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// });


app.get("/api/cart/:userId", async (req, res) => {
  try {
    const items = await Cart.find({ userId: req.params.userId });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to load cart" });
  }
});

// app.get("/api/cart/:userId", async (req, res) => {
//   const cart = await Cart.findOne({ userId });
//   if (!cart) return res.json([]);

//   res.json(cart.items);
// });




// Create new order
// 1️⃣ Create new order
app.post("/api/order", async (req, res) => {
  try {
    const { userName, amount } = req.body; // userName from frontend
    if (!userName || !amount) return res.status(400).json({ error: "userName & amount required" });

    const orderId = generateOrderId(); // always unique

    const order = new Order({
      orderId,
      userName,
      amount,
      paymentStatus: "Pending",
      orderStatus: "Pending"
    });

    await order.save();
    res.json({ success: true, message: "Order created", orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2️⃣ Payment upload (attach to existing pending order)
app.post("/api/payment", upload.single("screenshot"), async (req, res) => {
  try {
    const { userName } = req.body;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!userName) return res.status(400).json({ error: "userName required" });

    // Find existing pending order for this user
    const order = await Order.findOne({ userName, orderStatus: "Pending" });
    if (!order) return res.status(404).json({ error: "Pending order not found" });

    order.paymentScreenshot = req.file.filename;
    order.paymentStatus = "Pending";
    await order.save();

    res.json({ success: true, filename: req.file.filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 3️⃣ Admin fetch orders
app.get("/api/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4️⃣ Admin approve/reject (username-based)
app.put("/api/admin/orders/:userName/status", async (req, res) => {
  try {
    const { userName } = req.params;
    const { status } = req.body;

    const order = await Order.findOne({ userName, paymentStatus: "Pending" });
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.paymentStatus = status; // Verified / Rejected
    order.orderStatus = status === "Verified" ? "Processing" : "Cancelled";
    await order.save();

    res.json({
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// Node.js + Express + Mongoose example
// GET all orders
// app.get("/api/admin/orders", async (req, res) => {
//   const orders = await Order.find().sort({ createdAt: -1 });
//   res.json(orders);
// });

// PUT /api/admin/orders/:username/status
// app.put("/api/admin/orders/:username/status", async (req,res)=>{
//   const { username } = req.params;
//   const { status } = req.body;

//   try {
//     const order = await Order.findOne({ userName: username, paymentStatus: "Pending" });
//     if(!order) return res.status(404).json({ error: "Order not found" });

//     order.paymentStatus = status;               // Verified / Rejected
//     order.orderStatus = (status === "Verified") ? "Processing" : "Cancelled";
//     await order.save();

//     res.json({
//       paymentStatus: order.paymentStatus,
//       orderStatus: order.orderStatus
//     });
//   } catch(err){
//     res.status(500).json({ error: err.message });
//   }
// });


// PUT order status dynamically
app.put("/api/admin/orders/:orderId/status", async (req, res) => {
  const { orderId } = req.params;
  const { status, orderStatus } = req.body;

  try {
    const order = await Order.findOneAndUpdate(
      { orderId },
      { paymentStatus: status, orderStatus }, // use both fields
      { new: true }
    );

    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json({
      message: "Order updated",
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// Admin: fetch all uploaded screenshots
app.get("/api/admin/uploads", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json({ error: "Cannot read uploads" });
    res.json(files); // sirf filenames return
  });
});


// // Admin verify payment (simple route; add auth later)
// app.put('/api/admin/verify/:orderId', async (req, res) => {
//   const { orderId } = req.params;
//   const order = await Order.findOneAndUpdate(
//     { orderId },
//     { paymentVerified: true, status: 3 }, // after verification set status to Packed (3) or whatever you want
//     { new: true }
//   );
//   if (!order) return res.status(404).json({ error: 'Order not found' });
//   res.json({ message: 'Payment verified', order });
// });

app.post("/api/admin/payment/:id/approve", async (req, res) => {
  const payment = await Payment.findByIdAndUpdate(
    req.params.id,
    {
      paymentStatus: "Verified",
      orderStatus: "Confirmed"
    },
    { new: true }
  );
  if (!payment) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});

app.post("/api/admin/payment/:id/reject", async (req, res) => {
  const payment = await Payment.findByIdAndUpdate(
    req.params.id,
    {
      paymentStatus: "Rejected",
      orderStatus: "Pending"
    },
    { new: true }
  );
  if (!payment) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});


// // Admin: update order status
// app.put('/api/admin/orders/:orderId/status', async (req, res) => {
//   const { status } = req.body;
//   const order = await Order.findOneAndUpdate(
//     { orderId: req.params.orderId },
//     { orderStatus: status },
//     { new: true }
//   );
//   if (!order) return res.status(404).json({ error: "Order not found" });
//   res.json({ success: true });
// });

// Track order
app.get('/api/track/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findOne({ orderId });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ orderId: order.orderId, status: order.status, paymentVerified: order.paymentVerified, paymentScreenshot: order.paymentScreenshot });
});




//  Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
