Node.js backend for [Forq](https://forq.online) — a stock price forecasting SaaS. Handles authentication, user management, subscription billing, and acts as the API gateway between the frontend and the ML service.

## Tech stack

- Node.js + Express
- Prisma v7 (PostgreSQL)
- Clerk — token verification
- Stripe — subscription lifecycle via webhooks

## Architecture

This service sits between the React frontend and the FastAPI ML service. It verifies Clerk JWTs, manages user and subscription state in PostgreSQL, and proxies prediction requests to the ML service.

Users are lazily initialized on their first request to `GET /user/me`.

## Testing the subscription
 
Use Stripe's test card to upgrade to Premium without a real charge:
 
| Field | Value |
|---|---|
| Card number | `4242 4242 4242 4242` |
| Expiry | Any future date (e.g. `12/30`) |
| CVC | Any 3 digits (e.g. `123`) |
| Name | Anything |
 
> No real payment is processed — safe to use in the demo environment.
