import express, { type Request, type Response, type Express } from 'express'
import compression from 'compression'
import { logger } from '../../utils/logger'
import { status } from 'http-status'
import { ServerOptions } from '../../types/rest';

class RestServer {
  private readonly app: Express
  private readonly port: number

  constructor(options: ServerOptions) {
    this.port = options.port
    this.app = express()
  }

  private setUpMiddleware(): RestServer {
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))
    this.app.use(compression())
    return this
  }

  public bootstrap() {
    this.setUpMiddleware()
    this.initializeRoutes()
  }

  private initializeRoutes(): RestServer {
    this.app.get('/healthz', (_req: Request, res: Response) => {
      res.status(status.OK).send({
        status: 'success',
        message: 'OK',
        errMessage: null,
      })
    })
    return this
  }

  public start() {
    this.app.listen(this.port, () => {
      logger.info(`Rest server started on port: ${this.port}`)
    })
  }
}

export default RestServer
