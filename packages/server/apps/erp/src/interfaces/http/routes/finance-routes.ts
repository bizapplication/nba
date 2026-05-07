import { Router } from 'express';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

import type { AppContainer } from '../../../shared/container.ts';
import { FinanceController } from '../controllers/finance-controller.ts';

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

export function createFinanceRouter(container: AppContainer): Router {
  const router = Router();
  const controller = new FinanceController(container);

  router.get('/banks', wrapAsync(controller.listBanks));
  router.post('/banks', wrapAsync(controller.createBank));
  router.put('/banks/:id', wrapAsync(controller.updateBank));
  router.delete('/banks/:id', wrapAsync(controller.deleteBank));

  router.get('/ledgers', wrapAsync(controller.listLedgers));
  router.post('/ledgers', wrapAsync(controller.createLedger));
  router.put('/ledgers/:id', wrapAsync(controller.updateLedger));
  router.delete('/ledgers/:id', wrapAsync(controller.deleteLedger));

  router.get('/accounts', wrapAsync(controller.listAccounts));
  router.post('/accounts', wrapAsync(controller.createAccount));
  router.put('/accounts/:id', wrapAsync(controller.updateAccount));
  router.delete('/accounts/:id', wrapAsync(controller.deleteAccount));

  router.get('/transactions', wrapAsync(controller.listTransactions));
  router.post('/transactions', wrapAsync(controller.createTransaction));
  router.put('/transactions/:id', wrapAsync(controller.updateTransaction));
  router.delete('/transactions/:id', wrapAsync(controller.deleteTransaction));
  router.post('/transactions/:id/post', wrapAsync(controller.postTransaction));
  router.post('/transactions/:id/unpost', wrapAsync(controller.unpostTransaction));

  return router;
}
