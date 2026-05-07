import type { OpportunityCondition } from '../../domain/opportunities/OpportunityCondition';
import type {
  OpportunityQueryOptions,
  OpportunityRepository,
} from '../../domain/opportunities/OpportunityRepository';
import type { CreateOpportunityDTO } from './dto/CreateOpportunityDTO';
import type { UpdateOpportunityDTO } from './dto/UpdateOpportunityDTO';

export class OpportunityService {
  constructor(private readonly opportunityRepository: OpportunityRepository) {}

  async getAllOpportunities(condition: OpportunityCondition, options: OpportunityQueryOptions) {
    return this.opportunityRepository.findAll(condition, options);
  }

  async createOpportunity(dto: CreateOpportunityDTO) {
    return this.opportunityRepository.create(dto);
  }

  async updateOpportunity(id: string, dto: UpdateOpportunityDTO) {
    return this.opportunityRepository.updateById(id, dto);
  }

  async softDeleteOpportunity(id: string) {
    return this.opportunityRepository.softDeleteById(id);
  }

  async softDeleteOpportunitiesByCondition(condition: { ids: string[] }) {
    return this.opportunityRepository.softDeleteByIds(condition.ids);
  }
}
