const Joi = require("joi");

const registerValidator = Joi.object({
  name: Joi.string().min(2).max(50).required()
    .messages({
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name cannot exceed 50 characters",
      "any.required": "Name is required"
    }),
  email: Joi.string().email().required()
    .messages({
      "string.email": "Please enter a valid email address",
      "any.required": "Email is required"
    }),
  password: Joi.string().min(6).required()
    .messages({
      "string.min": "Password must be at least 6 characters",
      "any.required": "Password is required"
    }),
  monthlyBudget: Joi.number().min(0).optional()
});

const loginValidator = Joi.object({
  email: Joi.string().email().required()
    .messages({
      "string.email": "Please enter a valid email address",
      "any.required": "Email is required"
    }),
  password: Joi.string().required()
    .messages({
      "any.required": "Password is required"
    })
});

const expenseValidator = Joi.object({
  title: Joi.string().min(1).max(100).required()
    .messages({
      "string.min": "Title is required",
      "string.max": "Title cannot exceed 100 characters",
      "any.required": "Title is required"
    }),
  amount: Joi.number().min(0).required()
    .messages({
      "number.min": "Amount must be positive",
      "any.required": "Amount is required"
    }),
  category: Joi.string().optional(),
  description: Joi.string().max(500).optional(),
  date: Joi.date().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  paymentMethod: Joi.string().valid(
    "Cash", "Card", "UPI", "Net Banking", "Wallet"
  ).optional()
});

module.exports = {
  registerValidator,
  loginValidator,
  expenseValidator
};