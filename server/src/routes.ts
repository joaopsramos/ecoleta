import express from 'express'
import { celebrate, Joi } from 'celebrate'

import multer from 'multer'
import multerConfig from './config/multer'

import pointsControllers from './controllers/PointsControllers'
import itemsController from './controllers/ItemsController'

const routes = express.Router()
const upload = multer(multerConfig)

// index, show, create, update, delete
routes.get('/items', itemsController.index)

routes.post(
    '/points',
    upload.single('image'),
    celebrate(
        {
            body: Joi.object().keys({
                name: Joi.string().required(),
                email: Joi.string().required().email(),
                whatsapp: Joi.number().required(),
                latitude: Joi.number().required(),
                longitude: Joi.number().required(),
                city: Joi.string().required(),
                uf: Joi.string().required().max(2),
                items: Joi.string().required(),
            }),
        },
        {
            abortEarly: false,
        }
    ),
    pointsControllers.create
)
routes.get('/points', pointsControllers.index)
routes.get('/points/:id', pointsControllers.show)

export default routes
