import {check, validationResult} from "express-validator";
import Logbook from "../../config/logger.js";

const validateBuyMiner = [
    check('expected_price', 'expected_price is required').exists(),
    check('expected_price', 'expected_price must be a number').isNumeric(),
    check('EOI', 'EOI is required').exists(),
    check('EOI', 'EOI must be a number').isNumeric(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            Logbook.error(errors.array())
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export default validateBuyMiner;