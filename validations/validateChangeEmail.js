import {check, validationResult} from "express-validator";

const validateChangeEmail = [
    check('newEmail', 'New Email Address is required').exists(),
    check('newEmail', 'Please include a valid email').isEmail(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export default validateChangeEmail;