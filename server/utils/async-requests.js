function safeAsyncRequestHandler(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(err => {
      req.log.error(err);
      res.status(500).send('An internal error occurred');
    });
  };
}

module.exports = {
  safe: safeAsyncRequestHandler,
  safeAsyncRequestHandler,
};
