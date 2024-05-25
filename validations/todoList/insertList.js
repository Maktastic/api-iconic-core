import {check, validationResult} from "express-validator";

const insertListValidation = [
    check('title', 'title is required').exists(),
    check('message', 'message is required').exists(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export default insertListValidation;