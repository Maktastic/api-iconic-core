import {check, validationResult} from "express-validator";
import Logbook from "../../config/logger.js";

const validateDeleteMiner = [
    check('minerID', 'minerID is required').exists(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            Logbook.error(errors.array())
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export default validateDeleteMiner;