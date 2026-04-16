import 'reflect-metadata';

import express from 'express';

import {
  createCustomerBankAccountRouter,
  createCustomerRouter,
  createReceiptRouter,
} from './interfaces/http/routes/crm-routes.ts';
import { createFinanceRouter } from './interfaces/http/routes/finance-routes.ts';
import { createHealthRouter } from './interfaces/http/routes/health-routes.ts';
import {
  createDepartmentRouter,
  createEmployeeRouter,
  createEmploymentRouter,
  createExpenseClaimRouter,
  createPositionRouter,
} from './interfaces/http/routes/hr-routes.ts';
import {
  createGoodsReceiptRouter,
  createPaymentRouter,
  createProductRouter,
  createPurchaseOrderRouter,
  createVendorBankAccountRouter,
  createVendorInvoiceRouter,
  createVendorRouter,
} from './interfaces/http/routes/procurement-routes.ts';
import { createAppContainer } from './shared/container.ts';
import { AppError, isAppError } from './shared/errors.ts';

const container = await createAppContainer();
const app = express();

app.use(express.json());
app.use(createHealthRouter(container));
app.use('/api/finance', createFinanceRouter(container));
app.use('/api/customers', createCustomerRouter(container));
app.use('/api/customer-bank-accounts', createCustomerBankAccountRouter(container));
app.use('/api/receipts', createReceiptRouter(container));
app.use('/api/products', createProductRouter(container));
app.use('/api/vendors', createVendorRouter(container));
app.use('/api/vendor-bank-accounts', createVendorBankAccountRouter(container));
app.use('/api/purchase-orders', createPurchaseOrderRouter(container));
app.use('/api/goods-receipts', createGoodsReceiptRouter(container));
app.use('/api/vendor-invoices', createVendorInvoiceRouter(container));
app.use('/api/payments', createPaymentRouter(container));
app.use('/api/departments', createDepartmentRouter(container));
app.use('/api/positions', createPositionRouter(container));
app.use('/api/employees', createEmployeeRouter(container));
app.use('/api/employments', createEmploymentRouter(container));
app.use('/api/expense-claims', createExpenseClaimRouter(container));

app.use((_request, _response, next) => {
  next(new AppError(404, 'ROUTE_NOT_FOUND', 'Route not found'));
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (isAppError(error)) {
    response.status(error.statusCode).json({
      code: error.code,
      message: error.message,
      details: error.details ?? null,
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Unexpected internal server error',
    details: null,
  });
});

const server = app.listen(container.config.port, container.config.host, () => {
  console.log(
    `ERP backend listening on http://${container.config.host}:${container.config.port} (${container.config.dataMode})`,
  );
});

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}, shutting down ERP backend...`);

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await container.close();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
