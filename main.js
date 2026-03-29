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
    origin: ["https://frontend-masolata.vercel.app", "http://localhost:5173", "https://www.forq.online"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.options(/.*/, cors());

app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

startCronJobs()

app.get('/', (req, res) => {
    res.json({ message: 'Hello World!' });
})

app.use('/internal', internalRouter)
app.use('/predictions', predictionsRouter)
app.use('/webhooks', webhooksRouter)
app.use('/stripe', stripeRouter)
app.use('/user', userRouter)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Express server listening on port ${PORT}`))