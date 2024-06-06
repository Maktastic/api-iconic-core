import {check, validationResult} from "express-validator";

const validateForgotPassword = [
    check('newPassword', 'newPassword field is required').exists(),
    check('newPassword', 'Password must be atleast 8 characters').isLength({ min: 8 }),
    check('token', 'token field is required').exists(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export default validateForgotPassword;