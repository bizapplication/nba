import type {
  Customer,
  CustomerBankAccount,
  ReceiptOrder,
} from './types.ts';

export interface CustomerRepository {
  listAll(): Promise<Customer[]>;
  findById(id: string): Promise<Customer | null>;
  findByCode(customerCode: string): Promise<Customer | null>;
  save(customer: Customer): Promise<Customer>;
  delete(id: string): Promise<void>;
}

export interface CustomerBankAccountRepository {
  listAll(): Promise<CustomerBankAccount[]>;
  findById(id: string): Promise<CustomerBankAccount | null>;
  save(bankAccount: CustomerBankAccount): Promise<CustomerBankAccount>;
  delete(id: string): Promise<void>;
}

export interface ReceiptOrderRepository {
  listAll(): Promise<ReceiptOrder[]>;
  findById(id: string): Promise<ReceiptOrder | null>;
  findByOrderNo(receiptOrderNo: string): Promise<ReceiptOrder | null>;
  save(receiptOrder: ReceiptOrder): Promise<ReceiptOrder>;
  delete(id: string): Promise<void>;
}
