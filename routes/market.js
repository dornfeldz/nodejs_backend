import express from 'express'
import yahooFinance from 'yahoo-finance2'
import YahooFinance from "yahoo-finance2";

const router = express.Router()

router.get('/', async (req, res) => {
    const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] })
    try {
        const symbols = ['^GSPC', '^IXIC', '^DJI']
        const names = { '^GSPC': 'S&P 500', '^IXIC': 'NASDAQ', '^DJI': 'DOW' }

        const quotes = await Promise.all(
            symbols.map(s => yahooFinance.quote(s))
        )

        const result = quotes.map(q => ({
            name: names[q.symbol],
            value: q.regularMarketPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            change: `${q.regularMarketChangePercent > 0 ? '+' : ''}${q.regularMarketChangePercent.toFixed(2)}%`,
            positive: q.regularMarketChangePercent > 0
        }))

        // market status from the first quote
        const isOpen = quotes[0].marketState === 'REGULAR'
        result.push({
            name: 'Market Status',
            value: isOpen ? 'Open' : 'Closed',
            change: '',
            positive: null
        })

        res.json(result)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch market data' })
    }
})

export default router