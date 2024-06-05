import {check, validationResult} from "express-validator";

const validateLogin = [
    check('email', 'Email Address is required').exists(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
    check('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export default validateLogin;