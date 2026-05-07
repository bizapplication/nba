import type { Request, Response } from 'express';

import type { AppContainer } from '../../../shared/container.ts';

export class ProcurementController {
  container: AppContainer;

  constructor(container: AppContainer) {
    this.container = container;
  }

  listProducts = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.productService.list(request.query);
    response.json(result);
  };

  createProduct = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.productService.create(request.body);
    response.status(201).json(result);
  };

  updateProduct = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.productService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deleteProduct = async (request: Request, response: Response): Promise<void> => {
    await this.container.productService.delete(request.params.id);
    response.json({ success: true });
  };

  listVendors = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.vendorService.list(request.query);
    response.json(result);
  };

  createVendor = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.vendorService.create(request.body);
    response.status(201).json(result);
  };

  updateVendor = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.vendorService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deleteVendor = async (request: Request, response: Response): Promise<void> => {
    await this.container.vendorService.delete(request.params.id);
    response.json({ success: true });
  };

  listVendorBankAccounts = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.vendorBankAccountService.list(request.query);
    response.json(result);
  };

  createVendorBankAccount = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.vendorBankAccountService.create(request.body);
    response.status(201).json(result);
  };

  updateVendorBankAccount = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.vendorBankAccountService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deleteVendorBankAccount = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    await this.container.vendorBankAccountService.delete(request.params.id);
    response.json({ success: true });
  };

  listPurchaseOrders = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.purchaseOrderService.list(request.query);
    response.json(result);
  };

  createPurchaseOrder = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.purchaseOrderService.create(request.body);
    response.status(201).json(result);
  };

  updatePurchaseOrder = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.purchaseOrderService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deletePurchaseOrder = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    await this.container.purchaseOrderService.delete(request.params.id);
    response.json({ success: true });
  };

  listGoodsReceipts = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.goodsReceiptService.list(request.query);
    response.json(result);
  };

  createGoodsReceipt = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.goodsReceiptService.create(request.body);
    response.status(201).json(result);
  };

  updateGoodsReceipt = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.goodsReceiptService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deleteGoodsReceipt = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    await this.container.goodsReceiptService.delete(request.params.id);
    response.json({ success: true });
  };

  listVendorInvoices = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.vendorInvoiceService.list(request.query);
    response.json(result);
  };

  createVendorInvoice = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.vendorInvoiceService.create(request.body);
    response.status(201).json(result);
  };

  updateVendorInvoice = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.vendorInvoiceService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deleteVendorInvoice = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    await this.container.vendorInvoiceService.delete(request.params.id);
    response.json({ success: true });
  };

  executeVendorInvoice = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.vendorInvoiceService.execute(request.params.id);
    response.json(result);
  };

  listPayments = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.paymentService.list(request.query);
    response.json(result);
  };

  createPayment = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.paymentService.create(request.body);
    response.status(201).json(result);
  };

  updatePayment = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.paymentService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deletePayment = async (request: Request, response: Response): Promise<void> => {
    await this.container.paymentService.delete(request.params.id);
    response.json({ success: true });
  };

  executePayment = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.paymentService.execute(request.params.id);
    response.json(result);
  };
}
