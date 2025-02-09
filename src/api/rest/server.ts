import express, { type Express, Router, NextFunction } from 'express'
import compression from 'compression'
import { logger } from '../../utils/logger'
import { ServerOptions } from '../../types/rest';
import route from './routes/v1'
import {ValidationError} from 'joi';
import httpStatus from 'http-status';

class RestServer {
  private readonly app: Express
  private readonly port: number
  private readonly version: 'latest' | 'v1';
  private readonly router: Router;
  private routes;

  constructor(options: ServerOptions) {
    this.port = options.port
    if (options.version === 'latest') {
      this.version = 'v1'
    } else {
      this.version = options.version
    }
    const app = express()
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(compression())
    this.app = app
    this.router = express.Router()
    this.routes = route[this.version](this.router)
    // this.routes.map(Route => new Route(this.router))
  }

  public get restApp(): Express {
    return this.app
  }

  public bootstrap() {
    this.initializeRoutes()
    this.GlobalHttpErrorHandler()
  }

  private initializeRoutes() {
    this.routes.forEach(route => route.registerPaths())
    this.app.use('/api', this.router)
  }

  private GlobalHttpErrorHandler() {
    this.app.use((err: Error, req: express.Request, res: express.Response, next: NextFunction) => {
      if (err instanceof ValidationError) {
        const details = err.details
        const error: Record<string, string> = {}
        for (const d of details) {
          const field = d.message.split(' ')[0].replace(/"/g, '')
          error[field] = d.message
        }
        // console.error(error)
        res.status(httpStatus.UNPROCESSABLE_ENTITY).json({
          status: 'failed',
          message: req.path.includes('status') ? 'Path param validation error' : 'Payload validation error',
          error: error
        })
      }
      next()
    })
    this.app.use((req: express.Request, res: express.Response) => {
      res.status(httpStatus.METHOD_NOT_ALLOWED).json({
        status: 'failed',
        message: 'Method not allowed',
        error: {}
      });
    });
  }

  public start() {
    this.app.listen(this.port, () => {
      logger.info(`Rest server started on port: ${this.port}`)
    })
  }
}

export default RestServer
