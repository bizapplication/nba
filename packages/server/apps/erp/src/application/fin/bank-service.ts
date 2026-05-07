import type {
  BankDto,
  BankListQuery,
  CreateBankInput,
  PaginatedDto,
  UpdateBankInput,
} from './dto.ts';
import { mapBankToDto } from './mappers.ts';
import type {
  BankRepository,
  LedgerRepository,
} from '../../domain/fin/repositories.ts';
import { createId, nextSequenceCode } from '../../shared/id.ts';
import {
  conflict,
  notFound,
} from '../../shared/errors.ts';
import { paginate, includesSearch, sortByNewest } from '../../shared/pagination.ts';
import { nowIso } from '../../shared/time.ts';
import {
  asRecord,
  optionalEnum,
  optionalInteger,
  optionalString,
  readField,
  requiredEnum,
  requiredString,
} from '../../shared/validation.ts';
import {
  financialStatuses,
  lifecycleStatuses,
} from '../../domain/fin/types.ts';

export class BankService {
  bankRepository: BankRepository;
  ledgerRepository: LedgerRepository;

  constructor(bankRepository: BankRepository, ledgerRepository: LedgerRepository) {
    this.bankRepository = bankRepository;
    this.ledgerRepository = ledgerRepository;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<BankDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: BankListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      status: optionalEnum(readField(query, 'status'), lifecycleStatuses, 'status'),
      financialStatus: optionalEnum(
        readField(query, 'financialStatus'),
        financialStatuses,
        'financialStatus',
      ),
    };

    const banks = sortByNewest(await this.bankRepository.listAll(), 'updatedAt').filter(
      (bank) =>
        includesSearch(
          [bank.name, bank.shortName, bank.externalBankCode, bank.description],
          parsedQuery.search,
        ) &&
        (!parsedQuery.status || bank.status === parsedQuery.status) &&
        (!parsedQuery.financialStatus ||
          bank.financialStatus === parsedQuery.financialStatus),
    );

    return paginate(
      banks.map((bank) => mapBankToDto(bank)),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<BankDto> {
    const parsedInput = this.parseCreateOrUpdateInput(input);

    const existing = await this.bankRepository.findByExternalBankCode(
      parsedInput.bankCode,
    );
    if (existing) {
      throw conflict('BANK_CODE_EXISTS', 'bankCode already exists', {
        bankCode: parsedInput.bankCode,
      });
    }

    const banks = await this.bankRepository.listAll();
    const timestamp = nowIso();
    const bank = await this.bankRepository.save({
      id: createId('bank'),
      institutionCode: nextSequenceCode(
        'FI',
        banks.map((item) => item.institutionCode),
      ),
      name: parsedInput.name,
      shortName: parsedInput.shortName,
      displayName: parsedInput.name,
      institutionType: 'BANK',
      externalBankCode: parsedInput.bankCode,
      description: parsedInput.description ?? null,
      financialStatus: parsedInput.financialStatus,
      status: parsedInput.status,
      countryCode: null,
      currencyCodeDefault: null,
      partyId: null,
      metadata: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return mapBankToDto(bank);
  }

  async update(id: string, input: unknown): Promise<BankDto> {
    const existing = await this.bankRepository.findById(id);
    if (!existing) {
      throw notFound('BANK_NOT_FOUND', 'Bank not found', { id });
    }

    const parsedInput = this.parseCreateOrUpdateInput(input);
    const codeOwner = await this.bankRepository.findByExternalBankCode(
      parsedInput.bankCode,
    );
    if (codeOwner && codeOwner.id !== id) {
      throw conflict('BANK_CODE_EXISTS', 'bankCode already exists', {
        bankCode: parsedInput.bankCode,
      });
    }

    const bank = await this.bankRepository.save({
      ...existing,
      name: parsedInput.name,
      shortName: parsedInput.shortName,
      displayName: parsedInput.name,
      externalBankCode: parsedInput.bankCode,
      description: parsedInput.description ?? null,
      financialStatus: parsedInput.financialStatus,
      status: parsedInput.status,
      updatedAt: nowIso(),
    });

    return mapBankToDto(bank);
  }

  async delete(id: string): Promise<void> {
    const bank = await this.bankRepository.findById(id);
    if (!bank) {
      throw notFound('BANK_NOT_FOUND', 'Bank not found', { id });
    }

    const ledgers = await this.ledgerRepository.listAll();
    const linkedLedger = ledgers.find((ledger) => ledger.linkedInstitutionId === id);
    if (linkedLedger) {
      throw conflict(
        'BANK_IN_USE',
        'Bank is still linked to at least one ledger',
        { bankId: id, ledgerId: linkedLedger.id },
      );
    }

    await this.bankRepository.delete(id);
  }

  private parseCreateOrUpdateInput(
    input: unknown,
  ): CreateBankInput | UpdateBankInput {
    const payload = asRecord(input);
    return {
      name: requiredString(readField(payload, 'name'), 'name'),
      bankCode: requiredString(readField(payload, 'bankCode'), 'bankCode').toUpperCase(),
      shortName: requiredString(readField(payload, 'shortName'), 'shortName'),
      description: optionalString(readField(payload, 'description')),
      financialStatus: requiredEnum(
        readField(payload, 'financialStatus'),
        financialStatuses,
        'financialStatus',
      ),
      status: requiredEnum(readField(payload, 'status'), lifecycleStatuses, 'status'),
    };
  }
}
