import express from 'express'
import { savePredictions } from '../db/predictions.js'

const router = express.Router()

const verifyApiKey = (req, res, next) => {
    if (req.headers['x-api-key'] !== process.env.INTERNAL_API_KEY) {
        return res.status(403).json({ error: 'Forbidden' })
    }
    next()
}

router.post('/predictions', async (req, res) => {
    try {
        const results = await savePredictions(req.body)
        res.json({ saved: results.length })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to save predictions' })
    }
})

export default router