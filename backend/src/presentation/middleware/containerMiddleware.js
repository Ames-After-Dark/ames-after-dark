function containerMiddleware(container) {
  return (req, res, next) => {
    req.container = container;
    next();
  };
}

module.exports = containerMiddleware;
