import { Router } from 'express';
import { CustomerController } from '../controllers/CustomerController';

export function createCustomerRoutes(controller: CustomerController): Router {
  const router = Router();

  router.get('/', (req, res) => controller.getAll(req, res));
  router.post('/', controller.create);
  router.delete('/batch', controller.softDeleteByCondition);
  router.patch('/:id', controller.updateById);
  router.delete('/:id', controller.softDeleteById);

  return router;
}
