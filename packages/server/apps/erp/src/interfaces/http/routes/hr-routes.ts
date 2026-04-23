import { Router } from 'express';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

import type { AppContainer } from '../../../shared/container.ts';
import { HrController } from '../controllers/hr-controller.ts';

type AsyncHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<unknown> | unknown;

function wrapAsync(handler: AsyncHandler): RequestHandler {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

export function createDepartmentRouter(container: AppContainer): Router {
  const router = Router();
  const controller = new HrController(container);

  router.get('/', wrapAsync(controller.listDepartments));
  router.post('/', wrapAsync(controller.createDepartment));
  router.put('/:id', wrapAsync(controller.updateDepartment));
  router.delete('/:id', wrapAsync(controller.deleteDepartment));

  return router;
}

export function createPositionRouter(container: AppContainer): Router {
  const router = Router();
  const controller = new HrController(container);

  router.get('/', wrapAsync(controller.listPositions));
  router.post('/', wrapAsync(controller.createPosition));
  router.put('/:id', wrapAsync(controller.updatePosition));
  router.delete('/:id', wrapAsync(controller.deletePosition));

  return router;
}

export function createEmployeeRouter(container: AppContainer): Router {
  const router = Router();
  const controller = new HrController(container);

  router.get('/', wrapAsync(controller.listEmployees));
  router.post('/', wrapAsync(controller.createEmployee));
  router.put('/:id', wrapAsync(controller.updateEmployee));
  router.delete('/:id', wrapAsync(controller.deleteEmployee));

  return router;
}

export function createEmploymentRouter(container: AppContainer): Router {
  const router = Router();
  const controller = new HrController(container);

  router.get('/', wrapAsync(controller.listEmployments));
  router.post('/', wrapAsync(controller.createEmployment));
  router.put('/:id', wrapAsync(controller.updateEmployment));
  router.delete('/:id', wrapAsync(controller.deleteEmployment));

  return router;
}

export function createExpenseClaimRouter(container: AppContainer): Router {
  const router = Router();
  const controller = new HrController(container);

  router.get('/', wrapAsync(controller.listExpenseClaims));
  router.post('/', wrapAsync(controller.createExpenseClaim));
  router.put('/:id', wrapAsync(controller.updateExpenseClaim));
  router.delete('/:id', wrapAsync(controller.deleteExpenseClaim));
  router.post('/:id/execute', wrapAsync(controller.executeExpenseClaim));

  return router;
}
