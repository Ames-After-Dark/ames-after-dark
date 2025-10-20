/**
 * This is provider-agnostic.
 */

const authMiddleware = (verifyToken) => {
  if (typeof verifyToken !== 'function') {
    throw new Error('authMiddleware requires a verifyToken function');
  }

  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

      if (!token) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
      }

      const decodedUser = await verifyToken(token);

      if (!decodedUser) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      req.user = decodedUser;
      next();
    } catch (err) {
      console.error('Auth middleware error:', err);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
};

module.exports = authMiddleware;
