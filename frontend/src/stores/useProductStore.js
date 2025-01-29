import {create} from 'zustand';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

 export const useProductStore = create((set,get) => ({
    products:[],
    loading: false,
    createProduct: async(productData)=>{
        set({loading:true});
        try {
            const response= await axios.post('/product',productData);
            set((prevState)=>({
                products:[...prevState.products,response.data],
                loading:false
            }))
            return toast.success("Product created successfully");

        } catch (error) {
            set({loading:false});
            return toast.error(error.response.data.message|| "An error occurred");
        }
    },
    fetchAllProducts: async()=>{
        set({loading:true});
        try {
            const res= await axios.get('/product');
            set({products:res.data,loading:false});
        } catch (error) {
            set({loading:false});
            return toast.error(error.response.data.message|| "An error occurred");
        }
    },
    deleteProduct: async(id)=>{},
    toggleFeaturedProduct: async(id)=>{},

}));