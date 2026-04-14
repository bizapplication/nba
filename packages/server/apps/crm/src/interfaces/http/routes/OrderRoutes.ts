import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';

export function createOrderRoutes(controller: OrderController): Router {
  const router = Router();

  router.get('/', (req, res) => controller.getAll(req, res));
  router.post('/', controller.create);
  router.delete('/batch', controller.softDeleteByCondition);
  router.patch('/:id', controller.updateById);
  router.delete('/:id', controller.softDeleteById);

  return router;
}
