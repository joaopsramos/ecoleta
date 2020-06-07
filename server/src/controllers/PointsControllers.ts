import { Request, Response } from 'express'

import conn from '../database/connection'

const PointsController = {
    async index(req: Request, res: Response) {
        const { city, uf, items } = req.query

        const parsedItems = String(items)
            .split(',')
            .map((item) => Number(item.trim()))

        const points = await conn('points')
            .select('points.*')
            .join('points_items', 'points_items.point_id', '=', 'points.id')
            .where('city', String(city))
            .where('uf', String(uf))
            .whereIn('points_items.item_id', parsedItems)
            .distinct()

        const serializedPoints = points.map((point) => ({
            ...point,
            image_url: `http://192.168.15.14:3333/uploads/${point.image}`,
        }))

        return res.json(serializedPoints)
    },

    async show(req: Request, res: Response) {
        const { id } = req.params

        const point = await conn('points').where('id', id).first()
        const items = await conn('items')
            .select('title')
            .join('points_items', 'points_items.item_id', '=', 'items.id')
            .where('points_items.point_id', '=', id)

        if (!point) return res.status(400).json({ message: 'Point not found' })

        const serializedPoint = {
            ...point,
            image_url: `http://192.168.15.14:3333/uploads/${point.image}`,
        }

        return res.json({ point: serializedPoint, items })
    },

    async create(req: Request, res: Response) {
        // prettier-ignore
        const {
            name,
            email,
            whatsapp,
            city,
            uf,
            latitude,
            longitude,
            items,
        } = req.body

        const trx = await conn.transaction() // Se uma inserção der erro, não executa a outra

        const point = {
            name,
            email,
            whatsapp,
            city,
            uf,
            latitude,
            longitude,
            image: req.file.filename,
        }

        const returnedIds = await trx('points').insert(point)

        const point_id = returnedIds[0]
        const pointItems = items
            .split(',')
            .map((item: string) => Number(item.trim()))
            .map((itemId: number) => ({
                item_id: itemId,
                point_id,
            }))

        await trx('points_items').insert(pointItems)

        await trx.commit()

        return res.json({
            id: point_id,
            ...point,
        })
    },
}

export default PointsController
