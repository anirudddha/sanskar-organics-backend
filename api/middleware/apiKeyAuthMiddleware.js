const apiKeyAuthMiddleware = (req, res, next) => {
    const adminApiKey = process.env.ADMIN_API_KEY;

    if (!adminApiKey) {
        console.error("ADMIN_API_KEY is not set in environment variables.");
        return res.status(500).json({ message: "Server configuration error: Admin API key not found." });
    }

    const providedApiKey = req.headers['x-admin-api-key'];

    if (!providedApiKey) {
        return res.status(401).json({ message: "Unauthorized: Admin API key missing." });
    }

    if (providedApiKey !== adminApiKey) {
        return res.status(403).json({ message: "Unauthorized: Invalid Admin API key." });
    }
    next();
};

module.exports = apiKeyAuthMiddleware;