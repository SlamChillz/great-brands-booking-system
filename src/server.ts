import 'reflect-metadata'
import App from './app'
import {logger} from './utils/logger'

function main(): void {
  const app = new App()
  app.bootstrap()
    .then((app) => {
      logger.info('App bootstrap successfully.')
      app.start()
    })
    .catch(e => {
      logger.error('App boostrap failed:', e)
    })
}

(() => {
  main()
})()
