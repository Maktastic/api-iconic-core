import {check, validationResult} from "express-validator";

const updateListValidation = [
    check('userID', 'userID is required').exists(),
    check('listID', 'listID is required').exists(),
    check('updatedList', 'updateList object is required').exists(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

export default updateListValidation;