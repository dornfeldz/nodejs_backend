import cron from 'node-cron'
import { savePredictions } from '../db/predictions.js'

export function startCronJobs() {

    // every weekday at 6am
    cron.schedule('0 * * * *', async () => {
        console.log('Running daily prediction job...')
        try {
            const res = await fetch(`${process.env.FASTAPI_URL}/predict`, {
                headers: { 'x-api-key': process.env.INTERNAL_API_KEY }
            })
            const predictions = await res.json()
            console.log('FastAPI response:', JSON.stringify(predictions))
            await savePredictions(predictions)
            console.log(`Saved predictions for ${predictions.length} tickers`)
        } catch (err) {
            console.error('Daily prediction job failed:', err)
        }
    })

    // '0 2 * * 1'
    // every monday at 2am
    cron.schedule('30 * * * *', async () => {
        console.log('Running weekly retrain job...')
        try {
            await fetch(`${process.env.FASTAPI_URL}/train`, {
                method: 'POST',
                headers: { 'x-api-key': process.env.INTERNAL_API_KEY },
                signal: AbortSignal.timeout(30 * 60 * 1000)
            })
            console.log('Retrain triggered successfully')
        } catch (err) {
            console.error('Weekly retrain job failed:', err)
        }
    })

}
