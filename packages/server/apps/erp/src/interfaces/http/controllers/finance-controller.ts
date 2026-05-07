import type { Request, Response } from 'express';

import type { AppContainer } from '../../../shared/container.ts';

export class FinanceController {
  container: AppContainer;

  constructor(container: AppContainer) {
    this.container = container;
  }

  listBanks = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.bankService.list(request.query);
    response.json(result);
  };

  createBank = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.bankService.create(request.body);
    response.status(201).json(result);
  };

  updateBank = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.bankService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deleteBank = async (request: Request, response: Response): Promise<void> => {
    await this.container.bankService.delete(request.params.id);
    response.json({ success: true });
  };

  listLedgers = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.ledgerService.list(request.query);
    response.json(result);
  };

  createLedger = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.ledgerService.create(request.body);
    response.status(201).json(result);
  };

  updateLedger = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.ledgerService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deleteLedger = async (request: Request, response: Response): Promise<void> => {
    await this.container.ledgerService.delete(request.params.id);
    response.json({ success: true });
  };

  listAccounts = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.accountService.list(request.query);
    response.json(result);
  };

  createAccount = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.accountService.create(request.body);
    response.status(201).json(result);
  };

  updateAccount = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.accountService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deleteAccount = async (request: Request, response: Response): Promise<void> => {
    await this.container.accountService.delete(request.params.id);
    response.json({ success: true });
  };

  listTransactions = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.transactionService.list(request.query);
    response.json(result);
  };

  createTransaction = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.transactionService.create(request.body);
    response.status(201).json(result);
  };

  updateTransaction = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.transactionService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deleteTransaction = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    await this.container.transactionService.delete(request.params.id);
    response.json({ success: true });
  };

  postTransaction = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.transactionService.post(request.params.id);
    response.json(result);
  };

  unpostTransaction = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    const result = await this.container.transactionService.unpost(request.params.id);
    response.json(result);
  };
}
