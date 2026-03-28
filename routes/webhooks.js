import express from 'express'
import { Webhook } from 'svix'
import { PrismaClient } from '@prisma/client'
import {PrismaPg} from "@prisma/adapter-pg";

const router = express.Router()
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter })

router.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
    console.log('Webhook received:', req.headers['svix-id'])
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET)

    let event
    try {
        event = wh.verify(req.body, {
            'svix-id': req.headers['svix-id'],
            'svix-timestamp': req.headers['svix-timestamp'],
            'svix-signature': req.headers['svix-signature'],
        })
    } catch (err) {
        console.error('Webhook verification failed:', err.message)
        return res.status(400).json({ error: 'Invalid webhook' })
    }

    if (event.type === 'user.created') {
        const { id } = event.data

        try {
            await prisma.user.create({
                data: {
                    clerk_id: id,
                }
            })
            console.log(`Created user: ${id}`)
        } catch (err) {
            console.error('Failed to create user:', err.message)
            return res.status(500).json({ error: 'Failed to create user' })
        }
    }

    if (event.type === 'user.deleted') {
        const { id } = event.data

        try {
            await prisma.user.delete({
                where: { clerk_id: id }
            })
            console.log(`Deleted user: ${id}`)
        } catch (err) {
            console.error('Failed to delete user:', err.message)
            return res.status(500).json({ error: 'Failed to delete user' })
        }
    }

    res.json({ received: true })
})

export default router