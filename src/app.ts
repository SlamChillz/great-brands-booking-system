import config from './config'
import RestServer from './api/rest/server'
import db from './database'

class App {
  private static db = db
  private static restServer = new RestServer({ port: config.env.REST_PORT })

  public async bootstrap() {
    await App.db.initialize()
    App.restServer.bootstrap()
    return this
  }

  public start(): void {
    App.restServer.start()
  }
}

export default App
