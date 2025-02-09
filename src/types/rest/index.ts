import { Router } from 'express';

export type Version = 'latest' | 'v1';

export interface ServerOptions {
  port: number
  version: Version
}

export interface IRoute {
  router: Router;
  registerPaths: () => void;
}
