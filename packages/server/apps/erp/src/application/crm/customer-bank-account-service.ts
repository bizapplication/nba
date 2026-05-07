import type {
  CreateCustomerBankAccountInput,
  CustomerBankAccountDto,
  CustomerBankAccountListQuery,
  PaginatedDto,
  UpdateCustomerBankAccountInput,
} from './dto.ts';
import { mapCustomerBankAccountToDto } from './mappers.ts';
import type {
  CustomerBankAccountRepository,
  CustomerRepository,
  ReceiptOrderRepository,
} from '../../domain/crm/repositories.ts';
import { lifecycleStatuses } from '../../domain/fin/types.ts';
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

export class CustomerBankAccountService {
  customerBankAccountRepository: CustomerBankAccountRepository;
  customerRepository: CustomerRepository;
  receiptOrderRepository: ReceiptOrderRepository;

  constructor(
    customerBankAccountRepository: CustomerBankAccountRepository,
    customerRepository: CustomerRepository,
    receiptOrderRepository: ReceiptOrderRepository,
  ) {
    this.customerBankAccountRepository = customerBankAccountRepository;
    this.customerRepository = customerRepository;
    this.receiptOrderRepository = receiptOrderRepository;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<CustomerBankAccountDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: CustomerBankAccountListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      customerId: optionalString(readField(query, 'customerId')),
      status: optionalEnum(readField(query, 'status'), lifecycleStatuses, 'status'),
      currency: optionalCurrencyCode(readField(query, 'currency')),
    };

    const [customers, bankAccounts] = await Promise.all([
      this.customerRepository.listAll(),
      this.customerBankAccountRepository.listAll(),
    ]);

    const customersById = new Map(customers.map((customer) => [customer.id, customer]));
    const filtered = sortByNewest(bankAccounts, 'createdAt').filter(
      (bankAccount) =>
        includesSearch(
          [
            bankAccount.bankName,
            bankAccount.accountName,
            bankAccount.accountNo,
            customersById.get(bankAccount.customerId)?.customerName ?? '',
          ],
          parsedQuery.search,
        ) &&
        (!parsedQuery.customerId || bankAccount.customerId === parsedQuery.customerId) &&
        (!parsedQuery.status || bankAccount.status === parsedQuery.status) &&
        (!parsedQuery.currency || bankAccount.currencyCode === parsedQuery.currency),
    );

    return paginate(
      filtered.map((bankAccount) =>
        mapCustomerBankAccountToDto(bankAccount, customersById),
      ),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<CustomerBankAccountDto> {
    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const timestamp = nowIso();
    const shouldBeDefault = await this.shouldUseDefaultFlag(
      parsedInput.customerId,
      parsedInput.isDefault,
    );

    const created = await this.customerBankAccountRepository.save({
      id: createId('customerbank'),
      customerId: parsedInput.customerId,
      bankName: parsedInput.bankName,
      accountName: parsedInput.accountName,
      accountNo: parsedInput.accountNo,
      currencyCode: parsedInput.currency,
      isDefault: shouldBeDefault,
      status: parsedInput.status,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    if (shouldBeDefault) {
      await this.ensureOnlyOneDefault(created.customerId, created.id);
    }

    return this.toDto(created.id);
  }

  async update(id: string, input: unknown): Promise<CustomerBankAccountDto> {
    const existing = await this.customerBankAccountRepository.findById(id);
    if (!existing) {
      throw notFound(
        'CUSTOMER_BANK_ACCOUNT_NOT_FOUND',
        'Customer bank account not found',
        { id },
      );
    }

    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const shouldBeDefault = await this.shouldUseDefaultFlag(
      parsedInput.customerId,
      parsedInput.isDefault,
      id,
    );

    await this.customerBankAccountRepository.save({
      ...existing,
      customerId: parsedInput.customerId,
      bankName: parsedInput.bankName,
      accountName: parsedInput.accountName,
      accountNo: parsedInput.accountNo,
      currencyCode: parsedInput.currency,
      isDefault: shouldBeDefault,
      status: parsedInput.status,
      updatedAt: nowIso(),
    });

    if (shouldBeDefault) {
      await this.ensureOnlyOneDefault(parsedInput.customerId, id);
    }

    return this.toDto(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.customerBankAccountRepository.findById(id);
    if (!existing) {
      throw notFound(
        'CUSTOMER_BANK_ACCOUNT_NOT_FOUND',
        'Customer bank account not found',
        { id },
      );
    }

    const linkedReceipt = (await this.receiptOrderRepository.listAll()).find(
      (item) => item.customerBankAccountId === id,
    );
    if (linkedReceipt) {
      throw conflict(
        'CUSTOMER_BANK_ACCOUNT_IN_USE',
        'Customer bank account is referenced by at least one receipt order',
        { id, receiptOrderId: linkedReceipt.id },
      );
    }

    await this.customerBankAccountRepository.delete(id);
  }

  private async parseCreateOrUpdateInput(
    input: unknown,
  ): Promise<CreateCustomerBankAccountInput | UpdateCustomerBankAccountInput> {
    const payload = asRecord(input);
    const parsedInput: CreateCustomerBankAccountInput = {
      customerId: requiredString(readField(payload, 'customerId'), 'customerId'),
      bankName: requiredString(readField(payload, 'bankName'), 'bankName'),
      accountName: requiredString(readField(payload, 'accountName'), 'accountName'),
      accountNo: requiredString(readField(payload, 'accountNo'), 'accountNo'),
      currency: requiredCurrencyCode(readField(payload, 'currency'), 'currency'),
      isDefault: Boolean(readField(payload, 'isDefault')),
      status: requiredEnum(readField(payload, 'status'), lifecycleStatuses, 'status'),
    };

    const customer = await this.customerRepository.findById(parsedInput.customerId);
    if (!customer) {
      throw notFound('CUSTOMER_NOT_FOUND', 'Customer not found', {
        customerId: parsedInput.customerId,
      });
    }

    return parsedInput;
  }

  private async shouldUseDefaultFlag(
    customerId: string,
    isDefault: boolean,
    currentId?: string,
  ): Promise<boolean> {
    if (isDefault) {
      return true;
    }

    const existingBankAccounts = (await this.customerBankAccountRepository.listAll()).filter(
      (item) => item.customerId === customerId && item.id !== currentId,
    );

    return existingBankAccounts.length === 0;
  }

  private async ensureOnlyOneDefault(customerId: string, keepId: string): Promise<void> {
    const bankAccounts = await this.customerBankAccountRepository.listAll();

    for (const bankAccount of bankAccounts) {
      if (
        bankAccount.customerId !== customerId ||
        bankAccount.id === keepId ||
        !bankAccount.isDefault
      ) {
        continue;
      }

      await this.customerBankAccountRepository.save({
        ...bankAccount,
        isDefault: false,
        updatedAt: nowIso(),
      });
    }
  }

  private async toDto(id: string): Promise<CustomerBankAccountDto> {
    const bankAccount = await this.customerBankAccountRepository.findById(id);
    if (!bankAccount) {
      throw notFound(
        'CUSTOMER_BANK_ACCOUNT_NOT_FOUND',
        'Customer bank account not found',
        { id },
      );
    }

    const customers = await this.customerRepository.listAll();
    return mapCustomerBankAccountToDto(
      bankAccount,
      new Map(customers.map((customer) => [customer.id, customer])),
    );
  }
}
