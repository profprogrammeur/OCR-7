
const { body, validationResult } = require('express-validator')

const userValidationRules = () => {
    return [
        // username must be an email
        body('email')
            .isEmail()
            .normalizeEmail(),
        // Password must contain at least 1 uppercase letter 1 lower, 1 number and 1 symbol.
        body('password')
            .matches(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{12,}$/).withMessage('Password must contain at least 1 uppercase letter 1 lower, 1 number and 1 symbol.')
    ]
}

const validate = (req, res, next) => {
    const errors = validationResult(req)
    if (errors.isEmpty()) {
        return next()
    }
    const extractedErrors = []
    errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }))
    return res.status(422).json({
        errors: extractedErrors,
    })
}

module.exports = {
    userValidationRules,
    validate
}
