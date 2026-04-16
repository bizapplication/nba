import type {
  CreateCustomerInput,
  CustomerDto,
  CustomerListQuery,
  PaginatedDto,
  UpdateCustomerInput,
} from './dto.ts';
import { mapCustomerToDto } from './mappers.ts';
import type { CustomerBankAccount } from '../../domain/crm/types.ts';
import type {
  CustomerBankAccountRepository,
  CustomerRepository,
  ReceiptOrderRepository,
} from '../../domain/crm/repositories.ts';
import { customerStatuses } from '../../domain/crm/types.ts';
import { createId } from '../../shared/id.ts';
import { conflict, notFound } from '../../shared/errors.ts';
import { includesSearch, paginate, sortByNewest } from '../../shared/pagination.ts';
import { nowIso } from '../../shared/time.ts';
import {
  asRecord,
  optionalCurrencyCode,
  optionalEnum,
  optionalInteger,
  optionalString,
  readField,
  requiredCurrencyCode,
  requiredEnum,
  requiredString,
} from '../../shared/validation.ts';

export class CustomerService {
  customerRepository: CustomerRepository;
  customerBankAccountRepository: CustomerBankAccountRepository;
  receiptOrderRepository: ReceiptOrderRepository;

  constructor(
    customerRepository: CustomerRepository,
    customerBankAccountRepository: CustomerBankAccountRepository,
    receiptOrderRepository: ReceiptOrderRepository,
  ) {
    this.customerRepository = customerRepository;
    this.customerBankAccountRepository = customerBankAccountRepository;
    this.receiptOrderRepository = receiptOrderRepository;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<CustomerDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: CustomerListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      status: optionalEnum(readField(query, 'status'), customerStatuses, 'status'),
      defaultCurrency: optionalCurrencyCode(readField(query, 'defaultCurrency')),
    };

    const [customers, bankAccounts] = await Promise.all([
      this.customerRepository.listAll(),
      this.customerBankAccountRepository.listAll(),
    ]);

    const bankAccountsByCustomerId = this.groupBankAccountsByCustomerId(bankAccounts);
    const filtered = sortByNewest(customers, 'createdAt').filter(
      (customer) =>
        includesSearch(
          [
            customer.customerName,
            customer.customerCode,
            customer.shortName,
            customer.description,
          ],
          parsedQuery.search,
        ) &&
        (!parsedQuery.status || customer.status === parsedQuery.status) &&
        (!parsedQuery.defaultCurrency ||
          customer.defaultCurrency === parsedQuery.defaultCurrency),
    );

    return paginate(
      filtered.map((customer) =>
        mapCustomerToDto(customer, bankAccountsByCustomerId),
      ),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<CustomerDto> {
    const parsedInput = this.parseCreateOrUpdateInput(input);
    const existing = await this.customerRepository.findByCode(parsedInput.customerCode);
    if (existing) {
      throw conflict('CUSTOMER_CODE_EXISTS', 'Customer code already exists', {
        customerCode: parsedInput.customerCode,
      });
    }

    const timestamp = nowIso();
    const customer = await this.customerRepository.save({
      id: createId('customer'),
      customerCode: parsedInput.customerCode,
      customerName: parsedInput.customerName,
      shortName: parsedInput.shortName,
      status: parsedInput.status,
      defaultCurrency: parsedInput.defaultCurrency,
      description: parsedInput.description ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return this.toDto(customer.id);
  }

  async update(id: string, input: unknown): Promise<CustomerDto> {
    const existing = await this.customerRepository.findById(id);
    if (!existing) {
      throw notFound('CUSTOMER_NOT_FOUND', 'Customer not found', { id });
    }

    const parsedInput = this.parseCreateOrUpdateInput(input);
    const codeOwner = await this.customerRepository.findByCode(parsedInput.customerCode);
    if (codeOwner && codeOwner.id !== id) {
      throw conflict('CUSTOMER_CODE_EXISTS', 'Customer code already exists', {
        customerCode: parsedInput.customerCode,
      });
    }

    await this.customerRepository.save({
      ...existing,
      customerCode: parsedInput.customerCode,
      customerName: parsedInput.customerName,
      shortName: parsedInput.shortName,
      status: parsedInput.status,
      defaultCurrency: parsedInput.defaultCurrency,
      description: parsedInput.description ?? null,
      updatedAt: nowIso(),
    });

    return this.toDto(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.customerRepository.findById(id);
    if (!existing) {
      throw notFound('CUSTOMER_NOT_FOUND', 'Customer not found', { id });
    }

    const linkedBankAccount = (await this.customerBankAccountRepository.listAll()).find(
      (item) => item.customerId === id,
    );
    if (linkedBankAccount) {
      throw conflict(
        'CUSTOMER_HAS_BANK_ACCOUNTS',
        'Customer still has linked bank accounts',
        { id, customerBankAccountId: linkedBankAccount.id },
      );
    }

    const linkedReceipt = (await this.receiptOrderRepository.listAll()).find(
      (item) => item.customerId === id,
    );
    if (linkedReceipt) {
      throw conflict(
        'CUSTOMER_HAS_RECEIPTS',
        'Customer is referenced by at least one receipt order',
        { id, receiptOrderId: linkedReceipt.id },
      );
    }

    await this.customerRepository.delete(id);
  }

  private parseCreateOrUpdateInput(
    input: unknown,
  ): CreateCustomerInput | UpdateCustomerInput {
    const payload = asRecord(input);

    return {
      customerCode: requiredString(readField(payload, 'customerCode'), 'customerCode')
        .toUpperCase(),
      customerName: requiredString(readField(payload, 'customerName'), 'customerName'),
      shortName: requiredString(readField(payload, 'shortName'), 'shortName'),
      status: requiredEnum(readField(payload, 'status'), customerStatuses, 'status'),
      defaultCurrency: requiredCurrencyCode(
        readField(payload, 'defaultCurrency'),
        'defaultCurrency',
      ),
      description: optionalString(readField(payload, 'description')),
    };
  }

  private async toDto(id: string): Promise<CustomerDto> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw notFound('CUSTOMER_NOT_FOUND', 'Customer not found', { id });
    }

    const bankAccounts = await this.customerBankAccountRepository.listAll();
    return mapCustomerToDto(customer, this.groupBankAccountsByCustomerId(bankAccounts));
  }

  private groupBankAccountsByCustomerId(
    bankAccounts: CustomerBankAccount[],
  ): Map<string, CustomerBankAccount[]> {
    const map = new Map<string, CustomerBankAccount[]>();

    for (const bankAccount of bankAccounts) {
      const bucket = map.get(bankAccount.customerId) ?? [];
      bucket.push(bankAccount);
      map.set(bankAccount.customerId, bucket);
    }

    return map;
  }
}
