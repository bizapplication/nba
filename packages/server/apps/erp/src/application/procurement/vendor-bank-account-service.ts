import type {
  CreateVendorBankAccountInput,
  PaginatedDto,
  UpdateVendorBankAccountInput,
  VendorBankAccountDto,
  VendorBankAccountListQuery,
} from './dto.ts';
import { mapVendorBankAccountToDto } from './mappers.ts';
import type {
  PaymentOrderRepository,
  VendorBankAccountRepository,
  VendorRepository,
} from '../../domain/procurement/repositories.ts';
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

export class VendorBankAccountService {
  vendorBankAccountRepository: VendorBankAccountRepository;
  vendorRepository: VendorRepository;
  paymentOrderRepository: PaymentOrderRepository;

  constructor(
    vendorBankAccountRepository: VendorBankAccountRepository,
    vendorRepository: VendorRepository,
    paymentOrderRepository: PaymentOrderRepository,
  ) {
    this.vendorBankAccountRepository = vendorBankAccountRepository;
    this.vendorRepository = vendorRepository;
    this.paymentOrderRepository = paymentOrderRepository;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<VendorBankAccountDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: VendorBankAccountListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      vendorId: optionalString(readField(query, 'vendorId')),
      status: optionalEnum(readField(query, 'status'), lifecycleStatuses, 'status'),
      currency: optionalCurrencyCode(readField(query, 'currency')),
    };

    const [vendors, bankAccounts] = await Promise.all([
      this.vendorRepository.listAll(),
      this.vendorBankAccountRepository.listAll(),
    ]);

    const vendorsById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
    const filtered = sortByNewest(bankAccounts, 'createdAt').filter(
      (bankAccount) =>
        includesSearch(
          [
            bankAccount.bankName,
            bankAccount.accountName,
            bankAccount.accountNo,
            vendorsById.get(bankAccount.vendorId)?.vendorName ?? '',
          ],
          parsedQuery.search,
        ) &&
        (!parsedQuery.vendorId || bankAccount.vendorId === parsedQuery.vendorId) &&
        (!parsedQuery.status || bankAccount.status === parsedQuery.status) &&
        (!parsedQuery.currency || bankAccount.currencyCode === parsedQuery.currency),
    );

    return paginate(
      filtered.map((bankAccount) =>
        mapVendorBankAccountToDto(bankAccount, vendorsById),
      ),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<VendorBankAccountDto> {
    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const timestamp = nowIso();
    const shouldBeDefault = await this.shouldUseDefaultFlag(
      parsedInput.vendorId,
      parsedInput.isDefault,
    );

    const created = await this.vendorBankAccountRepository.save({
      id: createId('vendorbank'),
      vendorId: parsedInput.vendorId,
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
      await this.ensureOnlyOneDefault(created.vendorId, created.id);
    }

    return this.toDto(created.id);
  }

  async update(id: string, input: unknown): Promise<VendorBankAccountDto> {
    const existing = await this.vendorBankAccountRepository.findById(id);
    if (!existing) {
      throw notFound('VENDOR_BANK_ACCOUNT_NOT_FOUND', 'Vendor bank account not found', {
        id,
      });
    }

    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const shouldBeDefault = await this.shouldUseDefaultFlag(
      parsedInput.vendorId,
      parsedInput.isDefault,
      id,
    );

    await this.vendorBankAccountRepository.save({
      ...existing,
      vendorId: parsedInput.vendorId,
      bankName: parsedInput.bankName,
      accountName: parsedInput.accountName,
      accountNo: parsedInput.accountNo,
      currencyCode: parsedInput.currency,
      isDefault: shouldBeDefault,
      status: parsedInput.status,
      updatedAt: nowIso(),
    });

    if (shouldBeDefault) {
      await this.ensureOnlyOneDefault(parsedInput.vendorId, id);
    }

    return this.toDto(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.vendorBankAccountRepository.findById(id);
    if (!existing) {
      throw notFound('VENDOR_BANK_ACCOUNT_NOT_FOUND', 'Vendor bank account not found', {
        id,
      });
    }

    const linkedPayment = (await this.paymentOrderRepository.listAll()).find(
      (item) => item.vendorBankAccountId === id,
    );
    if (linkedPayment) {
      throw conflict(
        'VENDOR_BANK_ACCOUNT_IN_USE',
        'Vendor bank account is referenced by at least one payment order',
        { id, paymentOrderId: linkedPayment.id },
      );
    }

    await this.vendorBankAccountRepository.delete(id);
  }

  private async parseCreateOrUpdateInput(
    input: unknown,
  ): Promise<CreateVendorBankAccountInput | UpdateVendorBankAccountInput> {
    const payload = asRecord(input);
    const parsedInput: CreateVendorBankAccountInput = {
      vendorId: requiredString(readField(payload, 'vendorId'), 'vendorId'),
      bankName: requiredString(readField(payload, 'bankName'), 'bankName'),
      accountName: requiredString(readField(payload, 'accountName'), 'accountName'),
      accountNo: requiredString(readField(payload, 'accountNo'), 'accountNo'),
      currency: requiredCurrencyCode(readField(payload, 'currency'), 'currency'),
      isDefault: Boolean(readField(payload, 'isDefault')),
      status: requiredEnum(readField(payload, 'status'), lifecycleStatuses, 'status'),
    };

    const vendor = await this.vendorRepository.findById(parsedInput.vendorId);
    if (!vendor) {
      throw notFound('VENDOR_NOT_FOUND', 'Vendor not found', {
        vendorId: parsedInput.vendorId,
      });
    }

    return parsedInput;
  }

  private async shouldUseDefaultFlag(
    vendorId: string,
    isDefault: boolean,
    currentId?: string,
  ): Promise<boolean> {
    if (isDefault) {
      return true;
    }

    const existingBankAccounts = (await this.vendorBankAccountRepository.listAll()).filter(
      (item) => item.vendorId === vendorId && item.id !== currentId,
    );

    return existingBankAccounts.length === 0;
  }

  private async ensureOnlyOneDefault(vendorId: string, keepId: string): Promise<void> {
    const bankAccounts = await this.vendorBankAccountRepository.listAll();

    for (const bankAccount of bankAccounts) {
      if (
        bankAccount.vendorId !== vendorId ||
        bankAccount.id === keepId ||
        !bankAccount.isDefault
      ) {
        continue;
      }

      await this.vendorBankAccountRepository.save({
        ...bankAccount,
        isDefault: false,
        updatedAt: nowIso(),
      });
    }
  }

  private async toDto(id: string): Promise<VendorBankAccountDto> {
    const bankAccount = await this.vendorBankAccountRepository.findById(id);
    if (!bankAccount) {
      throw notFound('VENDOR_BANK_ACCOUNT_NOT_FOUND', 'Vendor bank account not found', {
        id,
      });
    }

    const vendors = await this.vendorRepository.listAll();
    return mapVendorBankAccountToDto(
      bankAccount,
      new Map(vendors.map((vendor) => [vendor.id, vendor])),
    );
  }
}
