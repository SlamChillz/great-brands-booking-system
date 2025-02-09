import Joi from 'joi'

export const eventInitSchema = Joi.object({
  name: Joi.string().min(3).required(),
  no_tickets: Joi.number().required(),
}).required()

export const bookEventSchema = Joi.object({
  eventId: Joi.string().uuid().required(),
})

export const cancelBookingSchema = Joi.object({
  bookId: Joi.string().uuid().required(),
})

export const eventStatusSchema = Joi.object({
  eventId: Joi.string().uuid().required(),
})

export const listManySchema = Joi.object({
  eventId: Joi.string().uuid().required(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().max(20).default(10),
})
