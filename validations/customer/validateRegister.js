import {check, validationResult} from "express-validator";
import Logbook from "../../config/logger.js";

const validateRegister = [
    check('name', 'Name is required').exists(),
    check('surname', 'Surname is required').exists(),
    check('mobile_number', 'Mobile Number is required').exists(),
    check('email', 'Email Address is required').exists(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
    check('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            Logbook.error(errors.array())
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export default validateRegister;