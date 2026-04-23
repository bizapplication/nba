import { Router } from 'express';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

import type { AppContainer } from '../../../shared/container.ts';
import { CrmController } from '../controllers/crm-controller.ts';

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

export function createCustomerRouter(container: AppContainer): Router {
  const router = Router();
  const controller = new CrmController(container);

  router.get('/', wrapAsync(controller.listCustomers));
  router.post('/', wrapAsync(controller.createCustomer));
  router.put('/:id', wrapAsync(controller.updateCustomer));
  router.delete('/:id', wrapAsync(controller.deleteCustomer));

  return router;
}

export function createCustomerBankAccountRouter(container: AppContainer): Router {
  const router = Router();
  const controller = new CrmController(container);

  router.get('/', wrapAsync(controller.listCustomerBankAccounts));
  router.post('/', wrapAsync(controller.createCustomerBankAccount));
  router.put('/:id', wrapAsync(controller.updateCustomerBankAccount));
  router.delete('/:id', wrapAsync(controller.deleteCustomerBankAccount));

  return router;
}

export function createReceiptRouter(container: AppContainer): Router {
  const router = Router();
  const controller = new CrmController(container);

  router.get('/', wrapAsync(controller.listReceipts));
  router.post('/', wrapAsync(controller.createReceipt));
  router.put('/:id', wrapAsync(controller.updateReceipt));
  router.delete('/:id', wrapAsync(controller.deleteReceipt));
  router.post('/:id/execute', wrapAsync(controller.executeReceipt));

  return router;
}
