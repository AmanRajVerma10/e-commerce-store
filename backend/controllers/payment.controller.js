import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";

export const createCheckoutSession = async (req, res) => {
  const { products, couponCode } = req.body;
  try {
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Please provide products" });
    }
    let totalAmount = 0;

    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100); //stripe requires amount in cents
      totalAmount += amount * product.quantity;
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
        quantity: product.quantity || 1,
      };
    });

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.userId,
        isActive: true,
      });
      if (coupon) {
        totalAmount -= Math.round(
          (totalAmount * coupon.discountPercentage) / 100
        );
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: coupon
        ? [{ coupon: await createStripeCoupon(coupon.discountPercentage) }]
        : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    if (totalAmount >= 20000) {
      await createNewCoupon(req.user._id);
    }
    return res
      .status(200)
      .json({ id: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {
    console.log("Error in creatingCheckoutSession controller", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          {
            isActive: false,
          }
        );
      }

      // create a new Order
      const products = JSON.parse(session.metadata.products);
      const newOrder = new Order({
        user: session.metadata.userId,
        products: products.map((product) => ({
          product: product.id,
          quantity: product.quantity,
          price: product.price,
        })),
        totalAmount: session.amount_total / 100, // convert from cents to dollars,
        stripeSessionId: sessionId,
      });

      await newOrder.save();

      res.status(200).json({
        success: true,
        message:
          "Payment successful, order created, and coupon deactivated if used.",
        orderId: newOrder._id,
      });
    }
  } catch (error) {
    console.error("Error processing successful checkout:", error);
    res
      .status(500)
      .json({
        message: "Error processing successful checkout",
        error: error.message,
      });
  }
};

async function createStripeCoupon(discountPercentage) {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: "once",
  });
  return coupon.id;
}

async function createNewCoupon(userId) {
  await Coupon.findOneAndDelete({userId});
  const newCoupon = new Coupon({
    userId,
    discountPercentage: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), //30 days from now
    code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
  });
}

// import Coupon from "../models/coupon.model.js";
// import Order from "../models/order.model.js";
// import { stripe } from "../lib/stripe.js";

// export const createCheckoutSession = async (req, res) => {
//   try {
//     const { products, couponCode } = req.body;

//     if (!Array.isArray(products) || products.length === 0) {
//       return res.status(400).json({ error: "Invalid or empty products array" });
//     }

//     let totalAmount = 0;

//     const lineItems = products.map((product) => {
//       const amount = Math.round(product.price * 100); // Convert to cents
//       totalAmount += amount * product.quantity;

//       return {
//         price_data: {
//           currency: "usd",
//           product_data: {
//             name: product.name,
//             images: [product.image],
//           },
//           unit_amount: amount,
//         },
//         quantity: product.quantity || 1,
//       };
//     });

//     let coupon = null;
//     if (couponCode) {
//       coupon = await Coupon.findOne({
//         code: couponCode,
//         userId: req.user._id,
//         isActive: true,
//       });
//       if (coupon) {
//         totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
//       }
//     }

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       line_items: lineItems,
//       mode: "payment",
//       success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
//       discounts: coupon
//         ? [{ coupon: await createStripeCoupon(coupon.discountPercentage) }]
//         : [],
//       metadata: {
//         userId: req.user._id.toString(),
//         couponCode: couponCode || "",
//         totalAmount, // Store totalAmount in metadata for later use
//         products: JSON.stringify(
//           products.map((p) => ({
//             id: p._id,
//             quantity: p.quantity,
//             price: p.price,
//           }))
//         ),
//       },
//     });

//     res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
//   } catch (error) {
//     console.error("Error processing checkout:", error);
//     res.status(500).json({ message: "Error processing checkout", error: error.message });
//   }
// };

// export const checkoutSuccess = async (req, res) => {
//   try {
//     const { sessionId } = req.body;
//     const session = await stripe.checkout.sessions.retrieve(sessionId);

//     if (session.payment_status === "paid") {
//       if (session.metadata.couponCode) {
//         await Coupon.findOneAndUpdate(
//           { code: session.metadata.couponCode, userId: session.metadata.userId },
//           { isActive: false }
//         );
//       }

//       // Prevent duplicate orders by checking existing ones
//       const existingOrder = await Order.findOne({ stripeSessionId: sessionId });
//       if (existingOrder) {
//         return res.status(400).json({ message: "Order already processed" });
//       }

//       // Create a new Order
//       const products = JSON.parse(session.metadata.products);
//       const newOrder = new Order({
//         user: session.metadata.userId,
//         products: products.map((product) => ({
//           product: product.id,
//           quantity: product.quantity,
//           price: product.price,
//         })),
//         totalAmount: session.amount_total / 100, // Convert cents to dollars
//         stripeSessionId: sessionId,
//       });

//       await newOrder.save();

//       // ✅ Now create a coupon only if totalAmount >= 20000
//       if (parseInt(session.metadata.totalAmount, 10) >= 20000) {
//         await createNewCoupon(session.metadata.userId);
//       }

//       res.status(200).json({
//         success: true,
//         message: "Payment successful, order created, and coupon deactivated if used.",
//         orderId: newOrder._id,
//       });
//     } else {
//       res.status(400).json({ message: "Payment not successful yet" });
//     }
//   } catch (error) {
//     console.error("Error processing successful checkout:", error);
//     res.status(500).json({ message: "Error processing successful checkout", error: error.message });
//   }
// };

// async function createStripeCoupon(discountPercentage) {
//   const coupon = await stripe.coupons.create({
//     percent_off: discountPercentage,
//     duration: "once",
//   });

//   return coupon.id;
// }

// async function createNewCoupon(userId) {
//   await Coupon.findOneAndDelete({ userId });

//   const newCoupon = new Coupon({
//     code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
//     discountPercentage: 10,
//     expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
//     userId: userId,
//   });

//   await newCoupon.save();
// }
