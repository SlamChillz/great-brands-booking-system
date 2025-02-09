import 'reflect-metadata'
import App from './app'
import {logger} from './utils/logger'
import config from './config'

function main(): void {
  const app = new App(config.env.REST_VERSION || 'latest')
  app.bootstrap()
    .then((app) => {
      logger.info('App bootstrap successfully.')
      app.start()
    })
    .catch(e => {
      logger.error('App boostrap failed:', e)
      process.exit(1)
    })
}

(() => {
  main()
})()
