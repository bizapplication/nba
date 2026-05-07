import type { CustomerCondition } from '../../domain/customers/CustomerCondition';
import type { CustomerQueryOptions, CustomerRepository } from '../../domain/customers/CustomerRepository';
import type { CreateCustomerDTO } from './dto/CreateCustomerDTO';
import type { UpdateCustomerDTO } from './dto/UpdateCustomerDTO';
export declare class CustomerService {
    private readonly customerRepository;
    constructor(customerRepository: CustomerRepository);
    getAllCustomers(condition: CustomerCondition, options: CustomerQueryOptions): Promise<{
        data: import("../../domain/customers/Customer").CustomerProps[];
        total: number;
    }>;
    createCustomer(dto: CreateCustomerDTO): Promise<import("../../domain/customers/Customer").CustomerProps>;
    updateCustomer(id: string, dto: UpdateCustomerDTO): Promise<import("../../domain/customers/Customer").CustomerProps | null>;
    softDeleteCustomer(id: string): Promise<number>;
    softDeleteCustomersByCondition(condition: {
        ids: string[];
    }): Promise<number>;
}
