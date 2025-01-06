import Coupon from '../models/coupon.model.js';

export const getCoupon = async (req, res) => {
    try {
        const coupon= await Coupon.findOne({userId: req.user._id, isActive: true});
        return res.status(200).json(coupon||null);
    } catch (error) {
        console.log("Error in getCoupon controller", error.message);
        return res.status(500).json({ message: "Server Error" });
    }
}

export const validateCoupon = async (req, res) => {
    const { code } = req.body;
    try {
        const coupon= await Coupon.findOne({code, isActive: true,userId: req.user._id});
        if(!coupon){
            return res.status(400).json({message: "Invalid Coupon Code"});
        }
        if(coupon.expirationDate < new Date()){
            coupon.isActive=false;
            await coupon.save();
            return res.status(400).json({message: "Coupon Expired"});
        }
        return res.status(200).json({
            message: "Coupon is valid",
            discountPercentage: coupon.discountPercentage,
            code: coupon.code
        })

    } catch (error) {
        console.log("Error in validateCoupon controller", error.message);
        return res.startus(500).json({ message: "Server Error" });
    }
}