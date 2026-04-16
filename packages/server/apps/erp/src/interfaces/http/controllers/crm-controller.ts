import type { Request, Response } from 'express';

import type { AppContainer } from '../../../shared/container.ts';

export class CrmController {
  container: AppContainer;

  constructor(container: AppContainer) {
    this.container = container;
  }

  listCustomers = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.customerService.list(request.query);
    response.json(result);
  };

  createCustomer = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.customerService.create(request.body);
    response.status(201).json(result);
  };

  updateCustomer = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.customerService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deleteCustomer = async (request: Request, response: Response): Promise<void> => {
    await this.container.customerService.delete(request.params.id);
    response.json({ success: true });
  };

  listCustomerBankAccounts = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.customerBankAccountService.list(request.query);
    response.json(result);
  };

  createCustomerBankAccount = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.customerBankAccountService.create(request.body);
    response.status(201).json(result);
  };

  updateCustomerBankAccount = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.customerBankAccountService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deleteCustomerBankAccount = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    await this.container.customerBankAccountService.delete(request.params.id);
    response.json({ success: true });
  };

  listReceipts = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.receiptService.list(request.query);
    response.json(result);
  };

  createReceipt = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.receiptService.create(request.body);
    response.status(201).json(result);
  };

  updateReceipt = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.receiptService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deleteReceipt = async (request: Request, response: Response): Promise<void> => {
    await this.container.receiptService.delete(request.params.id);
    response.json({ success: true });
  };

  executeReceipt = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.receiptService.execute(request.params.id);
    response.json(result);
  };
}
