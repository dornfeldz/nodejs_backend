import express from 'express'
import { PrismaClient } from '@prisma/client'
import {PrismaPg} from "@prisma/adapter-pg";
import authMiddleware from "../middleware/auth.js";

const router = express.Router()
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter })

router.get('/', authMiddleware, async (req, res) => {
    const tickers = req.query.tickers?.split(',') || []

    if (tickers.length === 0) {
        return res.status(400).json({ error: 'No tickers provided' })
    }

    try {
        const results = await Promise.all(
            tickers.map(async (symbol) => {
                const result = await prisma.prediction.findFirst({
                    where: {
                        ticker: { symbol: symbol.trim() }
                    },
                    orderBy: { predicted_at: 'desc' },
                })

                if (!result) return null

                return {
                    ticker: symbol,
                    predicted_at: result.predicted_at,
                    model_version: result.model_version,
                    confidence: result.confidence,
                    predictions: {
                        day_1: result.pred_day_1,
                        day_2: result.pred_day_2,
                        day_3: result.pred_day_3,
                        day_4: result.pred_day_4,
                        day_5: result.pred_day_5,
                    },
                    history: {
                        actual_day_1: result.actual_day_1,
                        actual_day_2: result.actual_day_2,
                        actual_day_3: result.actual_day_3,
                        actual_day_4: result.actual_day_4,
                        actual_day_5: result.actual_day_5,
                    }
                }
            })
        )

        res.json(results.filter(Boolean)) // remove nulls for tickers not found

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch predictions' })
    }
})

export default router