import {check, validationResult} from "express-validator";

const validateChangePassword = [
    check('currentPassword', 'CurrentPassword field is required').exists(),
    check('currentPassword', 'CurrentPassword must be atleast 8 characters').isLength({ min: 8 }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export default validateChangePassword;