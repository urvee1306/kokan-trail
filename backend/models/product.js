const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: String,
  caption: String,
  description: String,
  ingredients: String
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
