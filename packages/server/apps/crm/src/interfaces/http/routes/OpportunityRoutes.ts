import { Router } from 'express';
import { OpportunityController } from '../controllers/OpportunityController';

export function createOpportunityRoutes(controller: OpportunityController): Router {
  const router = Router();

  router.get('/', (req, res) => controller.getAll(req, res));
  router.post('/', controller.create);
  router.delete('/batch', controller.softDeleteByCondition);
  router.patch('/:id', controller.updateById);
  router.delete('/:id', controller.softDeleteById);

  return router;
}
