import Router from '@koa/router';
import { UserControllers } from './controllers/types';

export function bindUserControllers(
  c: UserControllers,
  r: Router,
) {
  r.put('/users/:id/balance', c.updateBalance);
}
