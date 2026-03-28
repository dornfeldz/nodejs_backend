import {verifyToken} from "@clerk/backend";

async function authMiddleware(req, res, next) {
    if (req.method === 'OPTIONS') {
        return next();
    }
    
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' })
    }
    try {
        const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
            clockSkewInMs: 300000,
        });

        req.userId = payload.sub;
        next();
    } catch(err) {
        console.error('Auth error:', err.message)
        res.status(401).json({ error: "Unauthorizexd" });
    }
}

export default authMiddleware;