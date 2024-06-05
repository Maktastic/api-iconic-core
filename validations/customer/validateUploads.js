import {body, check, validationResult} from "express-validator";

const validateUploads = [
    body('type', 'type field is required').optional().notEmpty(),
    body('passport').optional().notEmpty().withMessage('passport field is required'),
    body('id').optional().notEmpty().withMessage('ID field is required'),
    body('kyc').optional().notEmpty().withMessage('kyc field is required'),
    body('utility_bills').optional().notEmpty().withMessage('utility_bills field is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export default validateUploads;