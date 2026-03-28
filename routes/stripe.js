import express from 'express'
import Stripe from 'stripe'
import pkg from '@prisma/client'
const { PrismaClient } = pkg
import {PrismaPg} from "@prisma/adapter-pg";

const router = express.Router()
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter })
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

router.post('/create-checkout-session', express.json(),async (req, res) => {
    const clerkId = req.body.clerkId

    if (!clerkId) return res.status(400).json({ error: 'No user ID provided' })

    try {
        // create or retrieve stripe customer
        let user = await prisma.user.findUnique({
            where: { clerk_id: clerkId }
        })

        if (!user) return res.status(404).json({ error: 'User not found' })

        let stripeCustomerId = user.stripe_id

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                metadata: { clerk_id: clerkId }
            })
            stripeCustomerId = customer.id

            await prisma.user.update({
                where: { clerk_id: clerkId },
                data: { stripe_id: stripeCustomerId }
            })
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer: stripeCustomerId,
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            success_url: 'http://localhost:5173/',
            cancel_url: 'http://localhost:5173/pricing',
        })

        res.json({ url: session.url })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to create checkout session' })
    }
})

// stripe webhook — must use raw body
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature']

    let event
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
        console.error('Stripe webhook verification failed:', err.message)
        return res.status(400).json({ error: 'Invalid webhook' })
    }

    console.log('Webhook event received:', event.type)

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object
            const customerId = session.customer
            const subscriptionId = session.subscription

            console.log('checkout.session.completed received')
            console.log('customerId:', customerId)
            console.log('subscriptionId:', subscriptionId)

            await prisma.user.update({
                where: { stripe_id: customerId },
                data: {
                    is_premium: true,
                    stripe_sub_id: subscriptionId,
                }
            })
            console.log(`User upgraded to premium: ${customerId}`)
        }

        if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object
            const customerId = subscription.customer

            await prisma.user.update({
                where: { stripe_id: customerId },
                data: {
                    is_premium: false,
                    stripe_sub_id: null,
                }
            })
            console.log(`User downgraded to free: ${customerId}`)
        }

        if (event.type === 'customer.subscription.updated') {
            const subscription = event.data.object
            const customerId = subscription.customer

            console.log(subscription.status)
            console.log('cancel_at_period_end:', subscription.cancel_at_period_end)
            if (subscription.status === 'canceled') {
                await prisma.user.update({
                    where: { stripe_id: customerId },
                    data: {
                        is_premium: false,
                        stripe_sub_id: null,
                    }
                })
                console.log(`User downgraded to free: ${customerId}`)
            }
        }

    } catch (err) {
        console.error('Failed to handle webhook:', err.message)
        return res.status(500).json({ error: 'Webhook handler failed' })
    }

    res.json({ received: true })
})

router.post('/cancel-subscription', express.json(), async (req, res) => {
    const { clerkId } = req.body

    try {
        const user = await prisma.user.findUnique({
            where: { clerk_id: clerkId }
        })

        if (!user?.stripe_sub_id) {
            return res.status(400).json({ error: 'No active subscription found' })
        }

        await stripe.subscriptions.cancel(user.stripe_sub_id)

        await prisma.userStock.deleteMany({
            where: { user_id: user.id }
        })

        res.json({ success: true })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to cancel subscription' })
    }
})

export default router