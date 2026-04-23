import type {
  PaginatedDto,
  VendorDto,
  VendorListQuery,
  CreateVendorInput,
  UpdateVendorInput,
} from './dto.ts';
import { mapVendorToDto } from './mappers.ts';
import type { VendorBankAccount } from '../../domain/procurement/types.ts';
import type {
  PaymentOrderRepository,
  VendorBankAccountRepository,
  VendorRepository,
} from '../../domain/procurement/repositories.ts';
import { vendorStatuses } from '../../domain/procurement/types.ts';
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

export class VendorService {
  vendorRepository: VendorRepository;
  vendorBankAccountRepository: VendorBankAccountRepository;
  paymentOrderRepository: PaymentOrderRepository;

  constructor(
    vendorRepository: VendorRepository,
    vendorBankAccountRepository: VendorBankAccountRepository,
    paymentOrderRepository: PaymentOrderRepository,
  ) {
    this.vendorRepository = vendorRepository;
    this.vendorBankAccountRepository = vendorBankAccountRepository;
    this.paymentOrderRepository = paymentOrderRepository;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<VendorDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: VendorListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      status: optionalEnum(readField(query, 'status'), vendorStatuses, 'status'),
      defaultCurrency: optionalCurrencyCode(readField(query, 'defaultCurrency')),
    };

    const [vendors, bankAccounts] = await Promise.all([
      this.vendorRepository.listAll(),
      this.vendorBankAccountRepository.listAll(),
    ]);

    const bankAccountsByVendorId = this.groupBankAccountsByVendorId(bankAccounts);
    const filtered = sortByNewest(vendors, 'createdAt').filter(
      (vendor) =>
        includesSearch(
          [vendor.vendorName, vendor.vendorCode, vendor.shortName, vendor.description],
          parsedQuery.search,
        ) &&
        (!parsedQuery.status || vendor.status === parsedQuery.status) &&
        (!parsedQuery.defaultCurrency ||
          vendor.defaultCurrency === parsedQuery.defaultCurrency),
    );

    return paginate(
      filtered.map((vendor) => mapVendorToDto(vendor, bankAccountsByVendorId)),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<VendorDto> {
    const parsedInput = this.parseCreateOrUpdateInput(input);
    const existing = await this.vendorRepository.findByCode(parsedInput.vendorCode);
    if (existing) {
      throw conflict('VENDOR_CODE_EXISTS', 'Vendor code already exists', {
        vendorCode: parsedInput.vendorCode,
      });
    }

    const timestamp = nowIso();
    const vendor = await this.vendorRepository.save({
      id: createId('vendor'),
      vendorCode: parsedInput.vendorCode,
      vendorName: parsedInput.vendorName,
      shortName: parsedInput.shortName,
      status: parsedInput.status,
      defaultCurrency: parsedInput.defaultCurrency,
      description: parsedInput.description ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return this.toDto(vendor.id);
  }

  async update(id: string, input: unknown): Promise<VendorDto> {
    const existing = await this.vendorRepository.findById(id);
    if (!existing) {
      throw notFound('VENDOR_NOT_FOUND', 'Vendor not found', { id });
    }

    const parsedInput = this.parseCreateOrUpdateInput(input);
    const codeOwner = await this.vendorRepository.findByCode(parsedInput.vendorCode);
    if (codeOwner && codeOwner.id !== id) {
      throw conflict('VENDOR_CODE_EXISTS', 'Vendor code already exists', {
        vendorCode: parsedInput.vendorCode,
      });
    }

    await this.vendorRepository.save({
      ...existing,
      vendorCode: parsedInput.vendorCode,
      vendorName: parsedInput.vendorName,
      shortName: parsedInput.shortName,
      status: parsedInput.status,
      defaultCurrency: parsedInput.defaultCurrency,
      description: parsedInput.description ?? null,
      updatedAt: nowIso(),
    });

    return this.toDto(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.vendorRepository.findById(id);
    if (!existing) {
      throw notFound('VENDOR_NOT_FOUND', 'Vendor not found', { id });
    }

    const linkedBankAccount = (await this.vendorBankAccountRepository.listAll()).find(
      (item) => item.vendorId === id,
    );
    if (linkedBankAccount) {
      throw conflict(
        'VENDOR_HAS_BANK_ACCOUNTS',
        'Vendor still has linked bank accounts',
        { id, vendorBankAccountId: linkedBankAccount.id },
      );
    }

    const linkedPayment = (await this.paymentOrderRepository.listAll()).find(
      (item) => item.vendorId === id,
    );
    if (linkedPayment) {
      throw conflict(
        'VENDOR_HAS_PAYMENTS',
        'Vendor is referenced by at least one payment order',
        { id, paymentOrderId: linkedPayment.id },
      );
    }

    await this.vendorRepository.delete(id);
  }

  private parseCreateOrUpdateInput(
    input: unknown,
  ): CreateVendorInput | UpdateVendorInput {
    const payload = asRecord(input);

    return {
      vendorCode: requiredString(readField(payload, 'vendorCode'), 'vendorCode').toUpperCase(),
      vendorName: requiredString(readField(payload, 'vendorName'), 'vendorName'),
      shortName: requiredString(readField(payload, 'shortName'), 'shortName'),
      status: requiredEnum(readField(payload, 'status'), vendorStatuses, 'status'),
      defaultCurrency: requiredCurrencyCode(
        readField(payload, 'defaultCurrency'),
        'defaultCurrency',
      ),
      description: optionalString(readField(payload, 'description')),
    };
  }

  private async toDto(id: string): Promise<VendorDto> {
    const vendor = await this.vendorRepository.findById(id);
    if (!vendor) {
      throw notFound('VENDOR_NOT_FOUND', 'Vendor not found', { id });
    }

    const bankAccounts = await this.vendorBankAccountRepository.listAll();
    return mapVendorToDto(vendor, this.groupBankAccountsByVendorId(bankAccounts));
  }

  private groupBankAccountsByVendorId(
    bankAccounts: VendorBankAccount[],
  ): Map<string, VendorBankAccount[]> {
    const map = new Map<string, VendorBankAccount[]>();

    for (const bankAccount of bankAccounts) {
      const bucket = map.get(bankAccount.vendorId) ?? [];
      bucket.push(bankAccount);
      map.set(bankAccount.vendorId, bucket);
    }

    return map;
  }
}
