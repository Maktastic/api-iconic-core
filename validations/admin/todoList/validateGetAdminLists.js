import {check, param, query, validationResult} from "express-validator";
import Logbook from "../../../config/logger.js";

const validateGetAdminLists = [
    param('id').isMongoId().withMessage('Invalid ID format'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            Logbook.error(errors.array())
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export default validateGetAdminLists;