import mongoose from "mongoose";
import Cart from "../../schemas/cartSchema.js";
import Product from "../../schemas/productSchema.js";
import _ from "lodash";
import Logbook from "../../config/logger.js";
import CartItem from "../../schemas/cartItemSchema.js";


const cartController = {

    createCartItem: async ( req, res ) => {

        let { productID, quantity, userAmount, purchaseType } = req.body;
        let payload;

        try {
            let userID = new mongoose.Types.ObjectId(req.user._id);
            productID = new mongoose.Types.ObjectId(productID);
            quantity = parseFloat(quantity)
            userAmount = parseFloat(userAmount)

            // Check if product exists
            const productExists = await Product.findOne({ _id: productID });
            if (!productExists) {
                return res.status(404).send({ error: `Product with ID ${productID} doesn't exist.`, status: 404 });
            }

            // Check if the purchase type is valid
            if (!['fullMiner', 'partialMiner', 'container'].includes(purchaseType)) {
                return res.status(400).send({ error: 'Invalid purchase type.' });
            }

            if(purchaseType !== productExists?.type && productID !== productExists?._id) {
                return res.status(404).send({ error: 'Product ID / Purchase Type is invalid', status: 404 })
            }

            if(purchaseType === 'fullMiner') {
                 payload = {
                    userID: new mongoose.Types.ObjectId(userID),
                    quantity: quantity,
                    productID: new mongoose.Types.ObjectId(productID),
                    total_price: (productExists?.expected_price * quantity).toFixed(2),
                    purchaseType: purchaseType,
                    EOI: (productExists?.EOI * quantity).toFixed(2)
                }
            }

            else if(purchaseType === 'container') {
                payload = {
                    userID: new mongoose.Types.ObjectId(userID),
                    quantity: quantity,
                    productID: new mongoose.Types.ObjectId(productID),
                    total_price: (productExists.expected_price * quantity).toFixed(2),
                    purchaseType: purchaseType,
                    EOI: (productExists.EOI * quantity).toFixed(2)
                }
            }

            else if(purchaseType === 'partialMiner') {

                if(!userAmount) {
                    Logbook.error({ error: 'User Amount is invalid', status: 404 })
                    return res.status(404).send({ error: 'User Amount is invalid', status: 404 })
                }

                if(userAmount && userAmount > productExists?.expected_price) {
                    Logbook.error({ error: 'User Amount exceeded product value', status: 404 })
                    return res.status(404).send({ error: 'User Amount exceeded product value', status: 404 })
                }

                const sharePercent = ((userAmount/productExists?.expected_price)*100).toFixed(2)

                payload = {
                    userID: new mongoose.Types.ObjectId(userID),
                    quantity: quantity,
                    productID: new mongoose.Types.ObjectId(productID),
                    total_price: ((productExists?.expected_price * quantity) / sharePercent).toFixed(2),
                    userAmount: userAmount.toFixed(2),
                    purchaseType: purchaseType,
                    sharePercentage: sharePercent,
                    EOI: (productExists?.EOI * quantity).toFixed(2)
                }

            }

            else {
                return res.status(404).send({ error: 'Invalid Purchase Type', status: 400 })
            }


            // Find or create a new cart
            let cart = await Cart.findOne({ userID });
            if (!cart) {
                cart = new Cart({ userID });
                await cart.save();
            }

            payload.cartID = cart.cartID

            // Create and save the new cart item
            const newItem = new CartItem(payload);
            await newItem.save();

            // Add the new item to the cart
            cart.items.push(newItem._id);
            cart.total_quantity += newItem.quantity;
            cart.grand_total += newItem.total_price
            cart.total_EOI += newItem.EOI
            await cart.save();

            res.status(201).send({ cart, itemAdded: newItem });
        } catch (error) {
            console.error(error);
            res.status(500).send({ error: 'Internal Server Error', status: 500 });
        }

    }

}

export default cartController