import type { Request, Response } from 'express';
import { OrderService } from '../../../application/orders/OrderService';
export declare class OrderController {
    private readonly orderService;
    constructor(orderService: OrderService);
    getAll(req: Request, res: Response): Promise<Response>;
    create: (req: Request, res: Response) => Promise<Response>;
    updateById: (req: Request, res: Response) => Promise<Response>;
    softDeleteById: (req: Request, res: Response) => Promise<Response>;
    softDeleteByCondition: (req: Request, res: Response) => Promise<Response>;
    private parseOrderCondition;
}
