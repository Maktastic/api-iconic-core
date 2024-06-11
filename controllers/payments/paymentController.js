import mongoose from "mongoose";
import Product from "../../schemas/productSchema.js";
import Cart from "../../schemas/cartSchema.js";
import * as stripe from "stripe";


const paymentController = {

    createCheckoutSession: async ( req, res ) => {
        const userID = new mongoose.Types.ObjectId(req.user._id);

        try {
            // Fetch the user's cart
            const cart = await Cart.findOne({ userID }).populate('items').lean();

            if (!cart || cart.items.length === 0) {
                return res.status(400).send({ error: 'Cart is empty or not found' });
            }

            // Create line items for Stripe
            const lineItems = await Promise.all(cart.items.map(async item => {
                const product = await Product.findOne({ _id: item.productID }).lean();
                return {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: product.type,
                        },
                        unit_amount: Math.round(item.total_EOI * 100), // Stripe expects amount in cents
                    },
                    quantity: item.total_quantity,
                };
            }));

            // Create a Stripe Checkout session
            const session = await stripe.checkout.sessions.create({
                line_items: lineItems,
                mode: 'payment',
                success_url: `${process.env.BASE_PATH}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.BASE_PATH}/cancel`,
                metadata: {
                    userID: userID.toString(),
                    cartID: cart.cartID.toString(),
                },
            });

            res.status(200).send({ url: session.url });
        } catch (error) {
            console.error('Error creating Stripe checkout session:', error);
            res.status(500).send({ error: 'Internal Server Error', status: 500 });
        }

    }

}

export default paymentController