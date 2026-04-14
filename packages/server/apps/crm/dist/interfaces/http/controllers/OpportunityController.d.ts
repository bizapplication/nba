import type { Request, Response } from 'express';
import { OpportunityService } from '../../../application/opportunities/OpportunityService';
export declare class OpportunityController {
    private readonly opportunityService;
    constructor(opportunityService: OpportunityService);
    getAll(req: Request, res: Response): Promise<Response>;
    create: (req: Request, res: Response) => Promise<Response>;
    updateById: (req: Request, res: Response) => Promise<Response>;
    softDeleteById: (req: Request, res: Response) => Promise<Response>;
    softDeleteByCondition: (req: Request, res: Response) => Promise<Response>;
    private parseOpportunityCondition;
}
