import Joi from 'joi'

export const createUserSchema = Joi.object({
  username: Joi.string().min(3).required(),
  password: Joi.string().min(8).required(),
}).required()
