import mongoose from "mongoose";
import Cart from "../../schemas/cartSchema.js";
import BuyMiner from "../../schemas/minerSchema.js";


const cartController = {

    createCart: async ( req, res ) => {

        let { userID, quantity, price, buyMinerID, minerDescription } = req.body
        let buyMinerData = {};

        // get miner details

        let payload = {
            userID: userID,
            quantity: quantity,
            price: price,
            buyMinerID: buyMinerID,
            minerDescription: minerDescription
        }

        // check if product exists
        const checkBuyMiner = await BuyMiner.findOne({ _id: buyMinerID })

        console.log(checkBuyMiner)
        if(!checkBuyMiner) {
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