import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Please provide a product name"] },
    price: {
      type: Number,
      min: 0,
      required: [true, "Please provide a product price"],
    },
    description: {
      type: String,
      required: [true, "Please provide a product description"],
    },
    image: {
      type: String,
      required: [true, "Please provide a product image"],
    },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
