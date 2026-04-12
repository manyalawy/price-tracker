const logger = require('../lib/logger')

function requestLogger(req, res, next) {
  const start = Date.now()
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - start,
    })
  })
  next()
}

module.exports = { requestLogger }
