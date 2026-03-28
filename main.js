import 'dotenv/config'
import internalRouter from './routes/internal.js'
import predictionsRouter from './routes/predictions.js'
import express from 'express'
import { startCronJobs } from './cron/predictions.js'
import cors from 'cors'
import { verifyToken, createClerkClient } from "@clerk/backend";
import webhooksRouter from './routes/webhooks.js'
import stripeRouter from './routes/stripe.js'
import userRouter from './routes/user.js'


const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
});

const app = express();

app.use(cors({
    origin: 'https://frontend-masolata.vercel.app',
    credentials: true
}))

startCronJobs()

app.get('/', (req, res) => {
    res.json({ message: 'Hello World!' });
})

app.use('/internal', internalRouter)
app.use('/predictions', predictionsRouter)
app.use('/webhooks', webhooksRouter)
app.use('/stripe', stripeRouter)
app.use('/user', userRouter)

app.listen(3000, ()=>{
    console.log('Express server listening on port 3000');
});