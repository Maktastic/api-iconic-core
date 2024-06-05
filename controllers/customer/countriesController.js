import Countries from "../../schemas/countriesSchema.js";


const countriesController = {

    getCountries: async (req, res) => {

        await Countries.find({}).then((response) => {

            return res.json(response)

        }).catch((error) => {
            return res.status(400).send({ error: 'Error fetching countries', status: 400 })
        })

    }

}

export default countriesController