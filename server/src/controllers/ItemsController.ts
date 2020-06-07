import { Request, Response } from 'express'

import conn from '../database/connection'

const ItemsController = {
    async index(req: Request, res: Response) {
        const items = await conn('items').select('*')

        const serializedItems = items.map((item) => ({
            id: item.id,
            title: item.title,
            image_url: `http://192.168.15.14:3333/uploads/${item.image}`,
        }))

        return res.json(serializedItems)
    },
}

export default ItemsController
