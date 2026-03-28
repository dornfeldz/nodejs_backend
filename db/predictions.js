import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter })

export async function savePredictions(predictions) {
    return Promise.all(
        predictions.map(async (item) => {
            const ticker = await prisma.ticker.upsert({
                where:  { symbol: item.ticker },
                update: {},
                create: { symbol: item.ticker },
            })

            return prisma.prediction.upsert({
                where: {
                    ticker_id_predicted_at: {
                        ticker_id:    ticker.id,
                        predicted_at: new Date(item.predicted_at),
                    }
                },
                update: {
                    pred_day_1:    item.predictions.day_1,
                    pred_day_2:    item.predictions.day_2,
                    pred_day_3:    item.predictions.day_3,
                    pred_day_4:    item.predictions.day_4,
                    pred_day_5:    item.predictions.day_5,
                    confidence:    item.confidence,
                    model_version: item.model_version,
                    actual_day_1:  item.history.actual_day_1,
                    actual_day_2:  item.history.actual_day_2,
                    actual_day_3:  item.history.actual_day_3,
                    actual_day_4:  item.history.actual_day_4,
                    actual_day_5:  item.history.actual_day_5,
                },
                create: {
                    ticker_id:     ticker.id,
                    predicted_at:  new Date(item.predicted_at),
                    model_version: item.model_version,
                    confidence:    item.confidence,
                    pred_day_1:    item.predictions.day_1,
                    pred_day_2:    item.predictions.day_2,
                    pred_day_3:    item.predictions.day_3,
                    pred_day_4:    item.predictions.day_4,
                    pred_day_5:    item.predictions.day_5,
                    actual_day_1:  item.history.actual_day_1,
                    actual_day_2:  item.history.actual_day_2,
                    actual_day_3:  item.history.actual_day_3,
                    actual_day_4:  item.history.actual_day_4,
                    actual_day_5:  item.history.actual_day_5,
                }
            })
        })
    )
}