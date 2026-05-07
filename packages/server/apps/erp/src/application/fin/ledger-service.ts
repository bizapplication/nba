import type {
  CreateLedgerInput,
  LedgerDto,
  LedgerListQuery,
  PaginatedDto,
  UpdateLedgerInput,
} from './dto.ts';
import { mapLedgerToDto } from './mappers.ts';
import type {
  AccountRepository,
  BankRepository,
  LedgerRepository,
  TransactionRepository,
} from '../../domain/fin/repositories.ts';
import type { LedgerBook } from '../../domain/fin/types.ts';
import { createId } from '../../shared/id.ts';
import {
  conflict,
  notFound,
} from '../../shared/errors.ts';
import {
  includesSearch,
  isWithinDateRange,
  paginate,
  sortByNewest,
} from '../../shared/pagination.ts';
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
import {
  ledgerBookTypes,
  lifecycleStatuses,
} from '../../domain/fin/types.ts';

export class LedgerService {
  ledgerRepository: LedgerRepository;
  bankRepository: BankRepository;
  accountRepository: AccountRepository;
  transactionRepository: TransactionRepository;

  constructor(
    ledgerRepository: LedgerRepository,
    bankRepository: BankRepository,
    accountRepository: AccountRepository,
    transactionRepository: TransactionRepository,
  ) {
    this.ledgerRepository = ledgerRepository;
    this.bankRepository = bankRepository;
    this.accountRepository = accountRepository;
    this.transactionRepository = transactionRepository;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<LedgerDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: LedgerListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      status: optionalEnum(readField(query, 'status'), lifecycleStatuses, 'status'),
      type: optionalEnum(readField(query, 'type'), ledgerBookTypes, 'type'),
      bankId: optionalString(readField(query, 'bankId')),
      parentId: optionalString(readField(query, 'parentId')),
      baseCurrency: optionalCurrencyCode(readField(query, 'baseCurrency')),
      dateFrom: optionalString(readField(query, 'dateFrom')),
      dateTo: optionalString(readField(query, 'dateTo')),
    };

    const banks = await this.bankRepository.listAll();
    const ledgers = sortByNewest(await this.ledgerRepository.listAll(), 'createdAt').filter(
      (ledger) =>
        includesSearch(
          [ledger.name, ledger.code, ledger.description],
          parsedQuery.search,
        ) &&
        (!parsedQuery.status || ledger.status === parsedQuery.status) &&
        (!parsedQuery.type || ledger.bookType === parsedQuery.type) &&
        (!parsedQuery.bankId || ledger.linkedInstitutionId === parsedQuery.bankId) &&
        (!parsedQuery.parentId || ledger.parentBookId === parsedQuery.parentId) &&
        (!parsedQuery.baseCurrency ||
          ledger.baseCurrencyCode === parsedQuery.baseCurrency) &&
        isWithinDateRange(ledger.createdAt, parsedQuery.dateFrom, parsedQuery.dateTo),
    );

    const banksById = new Map(banks.map((bank) => [bank.id, bank]));
    const ledgersById = new Map(ledgers.map((ledger) => [ledger.id, ledger]));

    return paginate(
      ledgers.map((ledger) => mapLedgerToDto(ledger, banksById, ledgersById)),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<LedgerDto> {
    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const existing = await this.ledgerRepository.findByCode(parsedInput.code);
    if (existing) {
      throw conflict('LEDGER_CODE_EXISTS', 'Ledger code already exists', {
        code: parsedInput.code,
      });
    }

    const timestamp = nowIso();
    const ledger = await this.ledgerRepository.save({
      id: createId('ledger'),
      code: parsedInput.code,
      name: parsedInput.name,
      description: parsedInput.description ?? null,
      bookType: parsedInput.type,
      parentBookId: parsedInput.parentId ?? null,
      linkedInstitutionId: parsedInput.bankId ?? null,
      baseCurrencyCode: parsedInput.baseCurrency,
      status: parsedInput.status,
      legalEntityId: null,
      effectiveFrom: null,
      effectiveTo: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return this.toDto(ledger);
  }

  async update(id: string, input: unknown): Promise<LedgerDto> {
    const existing = await this.ledgerRepository.findById(id);
    if (!existing) {
      throw notFound('LEDGER_NOT_FOUND', 'Ledger not found', { id });
    }

    const parsedInput = await this.parseCreateOrUpdateInput(input, id);
    const codeOwner = await this.ledgerRepository.findByCode(parsedInput.code);
    if (codeOwner && codeOwner.id !== id) {
      throw conflict('LEDGER_CODE_EXISTS', 'Ledger code already exists', {
        code: parsedInput.code,
      });
    }

    const ledger = await this.ledgerRepository.save({
      ...existing,
      code: parsedInput.code,
      name: parsedInput.name,
      description: parsedInput.description ?? null,
      bookType: parsedInput.type,
      parentBookId: parsedInput.parentId ?? null,
      linkedInstitutionId: parsedInput.bankId ?? null,
      baseCurrencyCode: parsedInput.baseCurrency,
      status: parsedInput.status,
      updatedAt: nowIso(),
    });

    return this.toDto(ledger);
  }

  async delete(id: string): Promise<void> {
    const ledger = await this.ledgerRepository.findById(id);
    if (!ledger) {
      throw notFound('LEDGER_NOT_FOUND', 'Ledger not found', { id });
    }

    const childLedger = (await this.ledgerRepository.listAll()).find(
      (item) => item.parentBookId === id,
    );
    if (childLedger) {
      throw conflict('LEDGER_HAS_CHILDREN', 'Ledger has child ledgers', {
        id,
        childLedgerId: childLedger.id,
      });
    }

    const linkedAccount = (await this.accountRepository.listAll()).find(
      (account) => account.ledgerBookId === id,
    );
    if (linkedAccount) {
      throw conflict('LEDGER_HAS_ACCOUNTS', 'Ledger still has linked accounts', {
        id,
        accountId: linkedAccount.id,
      });
    }

    const linkedTransaction = (await this.transactionRepository.listAll()).find(
      (transaction) => transaction.header.ledgerBookId === id,
    );
    if (linkedTransaction) {
      throw conflict(
        'LEDGER_HAS_TRANSACTIONS',
        'Ledger still has linked transactions',
        { id, transactionId: linkedTransaction.header.id },
      );
    }

    await this.ledgerRepository.delete(id);
  }

  private async parseCreateOrUpdateInput(
    input: unknown,
    currentLedgerId?: string,
  ): Promise<CreateLedgerInput | UpdateLedgerInput> {
    const payload = asRecord(input);
    const parsedInput: CreateLedgerInput = {
      name: requiredString(readField(payload, 'name'), 'name'),
      code: requiredString(readField(payload, 'code'), 'code').toUpperCase(),
      description: optionalString(readField(payload, 'description')),
      type: requiredEnum(readField(payload, 'type'), ledgerBookTypes, 'type'),
      bankId: optionalString(readField(payload, 'bankId')),
      baseCurrency: requiredCurrencyCode(
        readField(payload, 'baseCurrency'),
        'baseCurrency',
      ),
      status: requiredEnum(readField(payload, 'status'), lifecycleStatuses, 'status'),
      parentId: optionalString(readField(payload, 'parentId')),
    };

    if (parsedInput.bankId) {
      const bank = await this.bankRepository.findById(parsedInput.bankId);
      if (!bank) {
        throw notFound('BANK_NOT_FOUND', 'Linked bank not found', {
          bankId: parsedInput.bankId,
        });
      }
    }

    if (parsedInput.parentId) {
      if (parsedInput.parentId === currentLedgerId) {
        throw conflict(
          'LEDGER_PARENT_INVALID',
          'Ledger cannot use itself as parent',
          { parentId: parsedInput.parentId },
        );
      }

      const parentLedger = await this.ledgerRepository.findById(parsedInput.parentId);
      if (!parentLedger) {
        throw notFound('LEDGER_PARENT_NOT_FOUND', 'Parent ledger not found', {
          parentId: parsedInput.parentId,
        });
      }
    }

    return parsedInput;
  }

  private async toDto(ledgerIdOrEntity: string | LedgerBook): Promise<LedgerDto> {
    const ledger =
      typeof ledgerIdOrEntity === 'string'
        ? await this.ledgerRepository.findById(ledgerIdOrEntity)
        : ledgerIdOrEntity;

    if (!ledger) {
      throw notFound('LEDGER_NOT_FOUND', 'Ledger not found');
    }

    const banks = await this.bankRepository.listAll();
    const ledgers = await this.ledgerRepository.listAll();
    const banksById = new Map(banks.map((bank) => [bank.id, bank]));
    const ledgersById = new Map(ledgers.map((item) => [item.id, item]));

    return mapLedgerToDto(ledger, banksById, ledgersById);
  }
}
