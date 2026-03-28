import express from 'express'
import { PrismaClient } from '@prisma/client'
import authMiddleware from '../middleware/auth.js'
import {PrismaPg} from "@prisma/adapter-pg";

const router = express.Router()
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter })

router.get('/me', authMiddleware, async (req, res) => {
    try {
        let user = await prisma.user.findUnique({
            where: { clerk_id: req.userId },
            include: { stocks: true }
        })

        if (!user) {
            user = await prisma.user.create({
                data: { clerk_id: req.userId },
                include: { stocks: true }
            })
        }

        res.json({
            is_premium: user.is_premium,
            stocks: user.stocks.map(s => s.symbol)
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch user' })
    }
})

router.post('/stocks', authMiddleware, express.json(), async (req, res) => {
    const { symbol } = req.body

    if (!symbol) return res.status(400).json({ error: 'No symbol provided' })

    const validSymbols = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOG', 'META']
    if (!validSymbols.includes(symbol)) {
        return res.status(400).json({ error: 'Invalid symbol' })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { clerk_id: req.userId },
            include: { stocks: true }
        })

        if (!user) return res.status(404).json({ error: 'User not found' })

        // free users can only have 1 stock
        if (!user.is_premium && user.stocks.length >= 1) {
            return res.status(403).json({ error: 'Free users can only track 1 stock. Upgrade to premium for more.' })
        }

        // check if already added
        if (user.stocks.some(s => s.symbol === symbol)) {
            return res.status(400).json({ error: 'Stock already added' })
        }

        await prisma.userStock.create({
            data: {
                user_id: user.id,
                symbol
            }
        })

        res.json({ success: true })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to add stock' })
    }
})

router.delete('/stocks', authMiddleware, express.json(), async (req, res) => {
    const { symbol } = req.body

    if (!symbol) return res.status(400).json({ error: 'No symbol provided' })

    try {
        const user = await prisma.user.findUnique({
            where: { clerk_id: req.userId }
        })

        if (!user) return res.status(404).json({ error: 'User not found' })

        await prisma.userStock.deleteMany({
            where: {
                user_id: user.id,
                symbol
            }
        })

        res.json({ success: true })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to remove stock' })
    }
})

export default router