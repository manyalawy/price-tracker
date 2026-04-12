const pino = require('pino')

const isDev = process.env.NODE_ENV !== 'production'

const transport = isDev
  ? { target: 'pino-pretty', options: { colorize: true } }
  : {
      target: '@logtail/pino',
      options: { sourceToken: process.env.BETTERSTACK_SOURCE_TOKEN },
    }

const logger = pino({ level: 'info' }, pino.transport(transport))

module.exports = logger
