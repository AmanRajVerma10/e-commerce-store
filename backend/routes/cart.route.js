import express from 'express';
import { protectRoute } from '../middlewares/auth.middleware.js'; 
import { addToCart, clearCart, getCartProducts, removeAllFromCart, updateQuantity } from '../controllers/cart.controller.js';

const router = express.Router();

router.get('/',protectRoute,getCartProducts);
router.post('/',protectRoute,addToCart);
router.delete('/',protectRoute,removeAllFromCart);
router.put('/:id',protectRoute,updateQuantity);
router.delete('/clear-cart',protectRoute,clearCart);

export default router;