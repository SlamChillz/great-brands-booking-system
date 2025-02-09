import config from './config'
import RestServer from './api/rest/server'
import { db } from './database'
import {Version} from './types/rest';

class App {
  private db;
  private restServer;

  constructor(version: Version) {
    this.db = db;
    this.restServer = new RestServer({port: config.env.REST_PORT, version: version})
  }

  public async bootstrap() {
    await this.db.initialize()
    this.restServer.bootstrap()
    return this
  }

  public get restApp() {
    return this.restServer.restApp;
  }

  public start(): void {
    this.restServer.start()
  }

  public shutdown(): Promise<void> {
    return this.db.destroy()
  }
}

export default App
