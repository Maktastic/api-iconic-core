import {check, validationResult} from "express-validator";

const verifyPhoneNumber = [
    check('phoneNumber', 'phoneNumber is required').exists(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export default verifyPhoneNumber;