export const serviceAuthMiddleware = (req, res, next) => {
  const appKey = req.headers["x-app-key"];

  if (!appKey) {
    return res.status(401).json({ message: "Missing X-APP-KEY" });
  }

  if (appKey !== process.env.PORTAL_APP_KEY) {
    return res.status(403).json({ message: "Invalid APP KEY" });
  }

  next();
};
