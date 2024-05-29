import {check, validationResult} from "express-validator";

const validateForgotPassword = [
    check('email', 'Email Address is required').exists(),
    check('email', 'Please include a valid email').isEmail(),
    check('resetCode', 'ResetCode field is required').exists(),
    check('resetCode', 'ResetCode must not contain any characters').isInt(),
    check('resetCode', 'resetCode must only be 6 digits').isLength({ min: 6, max: 6} ),
    check('newPassword', 'newPassword field is required').exists(),
    check('newPassword', 'Password must be atleast 8 characters').isLength({ min: 8 }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export default validateForgotPassword;