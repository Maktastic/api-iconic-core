import mongoose from "mongoose";
import Cart from "../../schemas/cartSchema.js";
import Product from "../../schemas/productSchema.js";
import _ from "lodash";
import Logbook from "../../config/logger.js";
import CartItem from "../../schemas/cartItemSchema.js";


const cartController = {

    getCart: async (req, res) => {
        try {
            const userID = new mongoose.Types.ObjectId(req.user._id);

            // Fetch the cart for the user
            const cart = await Cart.findOne({ userID }).populate('items').lean();

            if (!cart) {
                return res.status(404).send({ error: 'Cart not found', status: 404 });
            }

            res.status(200).send({ cart });
        } catch (error) {
            console.error(error);
            res.status(500).send({ error: 'Internal Server Error', status: 500 });
        }
    },

    deleteCart: async (req, res) => {
        try {
            const userID = new mongoose.Types.ObjectId(req.user._id);

            // Find the cart for the user
            const cart = await Cart.findOne({ userID });

            if (!cart) {
                return res.status(404).send({ error: 'Cart not found', status: 404 });
            }

            // Delete all items in the cart
            await CartItem.deleteMany({ cartID: cart.cartID });

            // Delete the cart itself
            await Cart.deleteOne({ userID });

            res.status(200).send({ message: 'Cart and its items deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).send({ error: 'Internal Server Error', status: 500 });
        }
    },

    createOrUpdateCart: async (req, res) => {
        let { productID, quantity, userAmount, purchaseType, itemID } = req.body;
        let payload;

        try {
            const userID = new mongoose.Types.ObjectId(req.user._id);
            productID = new mongoose.Types.ObjectId(productID);
            if (itemID) {
                itemID = new mongoose.Types.ObjectId(itemID);
            }
            quantity = parseFloat(quantity);
            userAmount = parseFloat(userAmount);

            // Check if product exists
            const productExists = await Product.findOne({ _id: productID }).lean();
            if (!productExists) {
                return res.status(404).send({ error: `Product with ID ${productID} doesn't exist.`, status: 404 });
            }

            // Validate purchase type
            if (!['fullMiner', 'partialMiner', 'container'].includes(purchaseType) || purchaseType !== productExists.type) {
                return res.status(400).send({ error: 'Invalid purchase type or mismatch with product type.', status: 400 });
            }

            // Construct payload based on purchase type
            if (purchaseType === 'fullMiner' || purchaseType === 'container') {
                payload = {
                    userID,
                    quantity,
                    productID,
                    total_price: (productExists.expected_price * quantity).toFixed(2),
                    purchaseType,
                    EOI: (productExists.EOI * quantity).toFixed(2)
                };
            } else if (purchaseType === 'partialMiner') {
                if (!userAmount || userAmount > productExists.expected_price) {
                    return res.status(400).send({ error: 'Invalid or exceeded user amount.', status: 400 });
                }

                const sharePercent = ((userAmount / productExists.expected_price) * 100).toFixed(2);
                payload = {
                    userID,
                    quantity,
                    productID,
                    total_price: ((productExists.expected_price * quantity) / sharePercent).toFixed(2),
                    userAmount: userAmount.toFixed(2),
                    purchaseType,
                    sharePercentage: sharePercent,
                    EOI: (productExists.EOI * quantity).toFixed(2)
                };
            }

            // Find or create a new cart
            let cart = await Cart.findOneAndUpdate(
                { userID },
                {},
                { new: true, upsert: true, setDefaultsOnInsert: true }
            ).lean();

            payload.cartID = cart.cartID;

            // Check if the item already exists in the cart
            let cartItem = await CartItem.findOne({ cartID: cart.cartID, productID }).lean();
            if (cartItem) {
                // Calculate the difference in quantity
                const quantityDifference = quantity - cartItem.quantity;

                // Update the existing cart item's quantity
                cartItem.quantity = quantity;
                cartItem.total_price = (productExists.expected_price * cartItem.quantity).toFixed(2);
                cartItem.EOI = (productExists.EOI * cartItem.quantity).toFixed(2);
                if (purchaseType === 'partialMiner') {
                    cartItem.userAmount = userAmount.toFixed(2);
                    const sharePercent = ((cartItem.userAmount / productExists.expected_price) * 100).toFixed(2);
                    cartItem.total_price = ((productExists.expected_price * cartItem.quantity) / sharePercent).toFixed(2);
                    cartItem.sharePercentage = sharePercent;
                }

                const updatedCartItem = await CartItem.findOneAndUpdate(
                    { _id: cartItem._id },
                    cartItem,
                    { new: true }
                ).lean();

                // Update the cart's total quantities and grand total
                cart.total_quantity += quantityDifference;
                cart.grand_total += parseFloat(cartItem.total_price) * (quantityDifference / cartItem.quantity);
                cart.total_EOI += parseFloat(cartItem.EOI) * (quantityDifference / cartItem.quantity);
                await Cart.findOneAndUpdate(
                    { userID },
                    { total_quantity: cart.total_quantity, grand_total: cart.grand_total, total_EOI: cart.total_EOI }
                );

                return res.status(200).send({ cart, itemUpdated: updatedCartItem });
            } else {
                // Create and save the new cart item
                const newItem = new CartItem(payload);
                await newItem.save();

                // Add the new item to the cart
                cart.items.push(newItem._id);
                cart.total_quantity += newItem.quantity;
                cart.grand_total += parseFloat(newItem.total_price);
                cart.total_EOI += parseFloat(newItem.EOI);
                await Cart.findOneAndUpdate(
                    { userID },
                    { items: cart.items, total_quantity: cart.total_quantity, grand_total: cart.grand_total, total_EOI: cart.total_EOI }
                );

                return res.status(201).send({ cart, itemAdded: newItem });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).send({ error: 'Internal Server Error', status: 500 });
        }
    }

}

export default cartController