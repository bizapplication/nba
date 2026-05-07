import type { Request, Response } from 'express';

import type { AppContainer } from '../../../shared/container.ts';

export class HrController {
  container: AppContainer;

  constructor(container: AppContainer) {
    this.container = container;
  }

  listDepartments = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.departmentService.list(request.query);
    response.json(result);
  };

  createDepartment = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.departmentService.create(request.body);
    response.status(201).json(result);
  };

  updateDepartment = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.departmentService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deleteDepartment = async (request: Request, response: Response): Promise<void> => {
    await this.container.departmentService.delete(request.params.id);
    response.json({ success: true });
  };

  listPositions = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.positionService.list(request.query);
    response.json(result);
  };

  createPosition = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.positionService.create(request.body);
    response.status(201).json(result);
  };

  updatePosition = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.positionService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deletePosition = async (request: Request, response: Response): Promise<void> => {
    await this.container.positionService.delete(request.params.id);
    response.json({ success: true });
  };

  listEmployees = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.employeeService.list(request.query);
    response.json(result);
  };

  createEmployee = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.employeeService.create(request.body);
    response.status(201).json(result);
  };

  updateEmployee = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.employeeService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deleteEmployee = async (request: Request, response: Response): Promise<void> => {
    await this.container.employeeService.delete(request.params.id);
    response.json({ success: true });
  };

  listEmployments = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.employmentService.list(request.query);
    response.json(result);
  };

  createEmployment = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.employmentService.create(request.body);
    response.status(201).json(result);
  };

  updateEmployment = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.employmentService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deleteEmployment = async (request: Request, response: Response): Promise<void> => {
    await this.container.employmentService.delete(request.params.id);
    response.json({ success: true });
  };

  listExpenseClaims = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.expenseClaimService.list(request.query);
    response.json(result);
  };

  createExpenseClaim = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.expenseClaimService.create(request.body);
    response.status(201).json(result);
  };

  updateExpenseClaim = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.expenseClaimService.update(
      request.params.id,
      request.body,
    );
    response.json(result);
  };

  deleteExpenseClaim = async (request: Request, response: Response): Promise<void> => {
    await this.container.expenseClaimService.delete(request.params.id);
    response.json({ success: true });
  };

  executeExpenseClaim = async (request: Request, response: Response): Promise<void> => {
    const result = await this.container.expenseClaimService.execute(request.params.id);
    response.json(result);
  };
}
