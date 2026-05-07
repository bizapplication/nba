"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
class CustomerService {
    customerRepository;
    constructor(customerRepository) {
        this.customerRepository = customerRepository;
    }
    async getAllCustomers(condition, options) {
        return this.customerRepository.findAll(condition, options);
    }
    async createCustomer(dto) {
        return this.customerRepository.create(dto);
    }
    async updateCustomer(id, dto) {
        return this.customerRepository.updateById(id, dto);
    }
    async softDeleteCustomer(id) {
        return this.customerRepository.softDeleteById(id);
    }
    async softDeleteCustomersByCondition(condition) {
        return this.customerRepository.softDeleteByIds(condition.ids);
    }
}
exports.CustomerService = CustomerService;
