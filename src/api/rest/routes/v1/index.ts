import { EventRoute } from './event';
import { UserRoute } from './user';
import { Router } from 'express';

const routes = {
  v1(router: Router) {
    const routes: (UserRoute | EventRoute)[] = []
    routes.push(new EventRoute(router));
    routes.push(new UserRoute(router));
    return routes;
  },
}

export default routes;
