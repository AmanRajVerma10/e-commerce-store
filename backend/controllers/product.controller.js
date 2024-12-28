import cloudinary from "../lib/cloudinary.js";
import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featuredProducts");
    if (featuredProducts) {
      return res.status(200).json(JSON.parse(featuredProducts));
    }

    featuredProducts = await Product.find({ isFeatured: true }).lean(); //get us js objects instead of mongoose objects
    if (!getFeaturedProducts) {
      return res.status(404).json({ message: "No featured products found" });
    }
    redis.set("featuredProducts", JSON.stringify(featuredProducts));
    return res.status(200).json(featuredProducts);
  } catch (error) {
    console.log("Error in getFeaturedProducts", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const addProduct = async (req, res) => {
  const { image, name, price, description, category } = req.body;
  try {
    let cloudinaryResponse = null;
    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }
    const product = await Product.create({
      name,
      price,
      description,
      category,
      image: cloudinaryResponse?.secure_url
        ? cloudinaryResponse.secure_url
        : "",
    });
    return res.status(201).json(product);
  } catch (error) {
    console.log("Error in addProduct", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  const id = req.params.id;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
      } catch (error) {
        console.log("Error deleting image from cloudinary", error.message);
      }
    }
    await Product.findByIdAndDelete(id);
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log("Error in deleteProduct", error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $sample: { size: 4 } },
      { $project: { name: 1, price: 1, image: 1, description: 1, _id: 1 } },
    ]); 
    // $sample is used to get random documents from the collection and
    // $project is used to include only the specified fields in the output 
    res.json(products);
  } catch (error) {
    console.log("Error in getRecommendedProducts", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    const products= await Product.find({category});
    return res.status(200).json(products);
  } catch (error) {
    console.log("Error in getProductsByCategory", error.message);
    return res.status(500).json({ message: error.message });
  }
}

export const toggleFeaturedProduct = async (req, res) => {
  const{id}=req.params;
  try {
    const product = await Product.findById(id);
    if(!product){
      return res.status(404).json({message:"Product not found"});
    }
    product.isFeatured = !product.isFeatured;
    const updatedProduct=await product.save();
    await updateFeaturedProductsCache();
    return res.status(200).json(updatedProduct);
  } catch (error) {
    console.log("Error in toggleFeaturedProduct", error.message);
    return res.status(500).json({ message: error.message });
  }
}

const updateFeaturedProductsCache = async () => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featuredProducts", JSON.stringify(featuredProducts));
  } catch (error) {
    console.log("Error in updateFeaturedProductsCache", error.message);
  }
};