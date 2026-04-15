//backend/validations/article.validation.js

//vallidation schema for article
const Joi = require('joi');

exports.processArticleSchema = Joi.object({
  title: Joi.string().allow('').optional(),
  content: Joi.string().min(10).required(),
});