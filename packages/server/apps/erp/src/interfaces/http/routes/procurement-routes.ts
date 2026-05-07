import { Router } from 'express';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

import type { AppContainer } from '../../../shared/container.ts';
import { ProcurementController } from '../controllers/procurement-controller.ts';

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

export function createVendorRouter(container: AppContainer): Router {
  const router = Router();
  const controller = new ProcurementController(container);

  router.get('/', wrapAsync(controller.listVendors));
  router.post('/', wrapAsync(controller.createVendor));
  router.put('/:id', wrapAsync(controller.updateVendor));
  router.delete('/:id', wrapAsync(controller.deleteVendor));

  return router;
}

export function createProductRouter(container: AppContainer): Router {
  const router = Router();
  const controller = new ProcurementController(container);

  router.get('/', wrapAsync(controller.listProducts));
  router.post('/', wrapAsync(controller.createProduct));
  router.put('/:id', wrapAsync(controller.updateProduct));
  router.delete('/:id', wrapAsync(controller.deleteProduct));

  return router;
}

export function createVendorBankAccountRouter(container: AppContainer): Router {
  const router = Router();
  const controller = new ProcurementController(container);

  router.get('/', wrapAsync(controller.listVendorBankAccounts));
  router.post('/', wrapAsync(controller.createVendorBankAccount));
  router.put('/:id', wrapAsync(controller.updateVendorBankAccount));
  router.delete('/:id', wrapAsync(controller.deleteVendorBankAccount));

  return router;
}

export function createPurchaseOrderRouter(container: AppContainer): Router {
  const router = Router();
  const controller = new ProcurementController(container);

  router.get('/', wrapAsync(controller.listPurchaseOrders));
  router.post('/', wrapAsync(controller.createPurchaseOrder));
  router.put('/:id', wrapAsync(controller.updatePurchaseOrder));
  router.delete('/:id', wrapAsync(controller.deletePurchaseOrder));

  return router;
}

export function createGoodsReceiptRouter(container: AppContainer): Router {
  const router = Router();
  const controller = new ProcurementController(container);

  router.get('/', wrapAsync(controller.listGoodsReceipts));
  router.post('/', wrapAsync(controller.createGoodsReceipt));
  router.put('/:id', wrapAsync(controller.updateGoodsReceipt));
  router.delete('/:id', wrapAsync(controller.deleteGoodsReceipt));

  return router;
}

export function createVendorInvoiceRouter(container: AppContainer): Router {
  const router = Router();
  const controller = new ProcurementController(container);

  router.get('/', wrapAsync(controller.listVendorInvoices));
  router.post('/', wrapAsync(controller.createVendorInvoice));
  router.put('/:id', wrapAsync(controller.updateVendorInvoice));
  router.delete('/:id', wrapAsync(controller.deleteVendorInvoice));
  router.post('/:id/execute', wrapAsync(controller.executeVendorInvoice));

  return router;
}

export function createPaymentRouter(container: AppContainer): Router {
  const router = Router();
  const controller = new ProcurementController(container);

  router.get('/', wrapAsync(controller.listPayments));
  router.post('/', wrapAsync(controller.createPayment));
  router.put('/:id', wrapAsync(controller.updatePayment));
  router.delete('/:id', wrapAsync(controller.deletePayment));
  router.post('/:id/execute', wrapAsync(controller.executePayment));

  return router;
}
