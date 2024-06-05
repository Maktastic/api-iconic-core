import mongoose from "mongoose";
import Cart from "../../schemas/cartSchema.js";
import Product from "../../schemas/productSchema.js";


const cartController = {

    createCart: async ( req, res ) => {

        let { userID, quantity, price, productID, minerDescription } = req.body
        let productData = {};

        userID = new mongoose.Types.ObjectId(userID)
        productID = new mongoose.Types.ObjectId(productID)

        // get miner details

        let payload = {
            userID: userID,
            quantity: quantity,
            price: price,
            productID: productID,
            minerDescription: minerDescription
        }

        // check if product exists
        const productExists = await Product.findOne({ _id: productID })

        console.log(productExists)
        if(!productExists) {
            return res.status(404).send({ error: "Product doesn't exists", status: 404})
        }

        buyMinerData = checkBuyMiner

        await Cart.create(payload)
            .then(async (response) => {
                console.log(response)



            })
            .catch((error) => {
                console.log(error)
                return res.status(500).send({ error: 'Internal Server Error', status: 500 })
            })
    }

}

export default cartController