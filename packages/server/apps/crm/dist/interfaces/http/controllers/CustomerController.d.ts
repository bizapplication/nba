import type { Request, Response } from 'express';
import { CustomerService } from '../../../application/customers/CustomerService';
export declare class CustomerController {
    private readonly customerService;
    constructor(customerService: CustomerService);
    getAll(req: Request, res: Response): Promise<Response>;
    create: (req: Request, res: Response) => Promise<Response>;
    updateById: (req: Request, res: Response) => Promise<Response>;
    softDeleteById: (req: Request, res: Response) => Promise<Response>;
    softDeleteByCondition: (req: Request, res: Response) => Promise<Response>;
    private parseCustomerCondition;
}
