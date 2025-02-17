import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useProductStore = create((set, get) => ({
  products: [],
  loading: false,
  createProduct: async (productData) => {
    set({ loading: true });
    try {
      const response = await axios.post("/product", productData);
      set((prevState) => ({
        products: [...prevState.products, response.data],
        loading: false,
      }));
      return toast.success("Product created successfully");
    } catch (error) {
      set({ loading: false });
      return toast.error(error.response.data.message || "An error occurred");
    }
  },
  fetchAllProducts: async () => {
    set({ loading: true });
    try {
      const res = await axios.get("/product");
      set({ products: res.data, loading: false });
    } catch (error) {
      set({ loading: false });
      return toast.error(error.response.data.message || "An error occurred");
    }
  },
  fetchProductsByCategory: async (category) => {
		set({ loading: true });
		try {
			const response = await axios.get(`/product/category/${category}`);
			set({ products: response.data, loading: false });
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			toast.error(error.response.data.error || "Failed to fetch products");
		}
	},
  deleteProduct: async (id) => {
    set({ loading: true });
    try {
      const res= await axios.delete(`/product/${id}`);
      set((prevProducts) => ({
        products: prevProducts.products.filter((product) => product._id !== id),
        loading: false,
      }));  
    } catch (error) {
      set({ loading: false });
      return toast.error(error.response.data.message || "An error occurred");
    }
  },
  toggleFeaturedProduct: async (id) => {
    set({ loading: true });
    try {
      const response = await axios.patch(`/product/${id}`);
      set((prevProducts) => ({
        products: prevProducts.products.map((product) =>
          product._id === id
            ? { ...product, isFeatured: response.data.isFeatured }
            : product
        ),
        loading: false,
      }));
    } catch (error) {
      set({ loading: false });
      return toast.error(error.response.data.message || "An error occurred");
    }
  },
  fetchFeaturedProducts: async () => {
		set({ loading: true });
		try {
			const response = await axios.get("/product/featured");
			set({ products: response.data, loading: false });
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			console.log("Error fetching featured products:", error);
		}
	},
}));
