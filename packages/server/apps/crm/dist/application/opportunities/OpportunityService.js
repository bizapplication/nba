"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpportunityService = void 0;
class OpportunityService {
    opportunityRepository;
    constructor(opportunityRepository) {
        this.opportunityRepository = opportunityRepository;
    }
    async getAllOpportunities(condition, options) {
        return this.opportunityRepository.findAll(condition, options);
    }
    async createOpportunity(dto) {
        return this.opportunityRepository.create(dto);
    }
    async updateOpportunity(id, dto) {
        return this.opportunityRepository.updateById(id, dto);
    }
    async softDeleteOpportunity(id) {
        return this.opportunityRepository.softDeleteById(id);
    }
    async softDeleteOpportunitiesByCondition(condition) {
        return this.opportunityRepository.softDeleteByIds(condition.ids);
    }
}
exports.OpportunityService = OpportunityService;
