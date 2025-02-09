import { Router } from 'express';
import { IRoute } from '../../../../types/rest';
import { UserController } from '../../controllers/v1';

export class UserRoute implements IRoute {
  router: Router;
  controller: UserController = new UserController();
  private readonly basePath = '/v1';

  constructor(router: Router) {
    this.router = router;
    this.registerPaths();
  }

  public registerPaths(): void {
    this.router.post(this.basePath + '/users', this.controller.create);
  }
}
