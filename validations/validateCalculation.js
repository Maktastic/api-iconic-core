import {check, validationResult} from "express-validator";

const validateCalculation = [
    check('hashrate', 'hashrate is required').exists(),
    check('power', 'power is required').exists(),
    check('costPerKwh', 'costPerKwh is required').exists(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export default validateCalculation;