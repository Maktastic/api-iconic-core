import {check, validationResult} from "express-validator";

const validateGlobalContracts = [
    check('title', 'title field is required').exists(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export default validateGlobalContracts;