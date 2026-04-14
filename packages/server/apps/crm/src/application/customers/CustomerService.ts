import type { CustomerCondition } from '../../domain/customers/CustomerCondition';
import type { CustomerQueryOptions, CustomerRepository } from '../../domain/customers/CustomerRepository';
import type { CreateCustomerDTO } from './dto/CreateCustomerDTO';
import type { UpdateCustomerDTO } from './dto/UpdateCustomerDTO';

export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async getAllCustomers(condition: CustomerCondition, options: CustomerQueryOptions) {
    return this.customerRepository.findAll(condition, options);
  }

  async createCustomer(dto: CreateCustomerDTO) {
    return this.customerRepository.create(dto);
  }

  async updateCustomer(id: string, dto: UpdateCustomerDTO) {
    return this.customerRepository.updateById(id, dto);
  }

  async softDeleteCustomer(id: string) {
    return this.customerRepository.softDeleteById(id);
  }

  async softDeleteCustomersByCondition(condition: { ids: string[] }) {
    return this.customerRepository.softDeleteByIds(condition.ids);
  }
}
