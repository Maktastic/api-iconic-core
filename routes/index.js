import express from "express";
const routes = express.Router()

routes.get('/hello', (req, res) => {
    res.status(200).send('hello world')
})

export default routes