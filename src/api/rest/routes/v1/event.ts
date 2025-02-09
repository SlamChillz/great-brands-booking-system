import { IRoute } from '../../../../types/rest';
import { Router } from 'express';
import { EventController } from '../../controllers/v1';
import {authMiddy} from '../../middlewares';

export class EventRoute implements IRoute {
  public router: Router;
  controller: EventController = new EventController();
  private readonly basePath= '/v1'

  constructor(router: Router) {
    this.router = router;
    this.registerPaths();
  }

  public registerPaths(): void {
    this.router.post(
      this.basePath + '/initialize', authMiddy, this.controller.initialize);
    this.router.post(this.basePath + '/book', authMiddy, this.controller.book);
    this.router.post(this.basePath + '/cancel', authMiddy, this.controller.cancel);
    this.router.get(this.basePath + '/status/:eventId', this.controller.status);
    this.router.get(this.basePath + '/events/:eventId/bookings', authMiddy, this.controller.bookings);
    this.router.get(this.basePath + '/events/:eventId/waitlists', authMiddy, this.controller.waitlists);
  }
}
