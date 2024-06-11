import {check, validationResult} from "express-validator";

const verifyPhoneNumber = [
    check('token', 'token field is required').exists(),
    check('token', 'token length must be 6 digits').isLength({ max: 6, min: 6 }),
    check('token', 'token must be a number').isNumeric(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export default verifyPhoneNumber;