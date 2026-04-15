//backend/middlewares/validation.js
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const validationError = new Error(
      error.details.map((detail) => detail.message).join(', ')
    );
    validationError.statusCode = 400;
    validationError.name = 'RequestValidationError';

    return next(validationError);
  }

  next();
};

module.exports = validate;
