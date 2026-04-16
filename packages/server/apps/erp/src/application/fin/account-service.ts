import type {
  AccountDto,
  AccountListQuery,
  CreateAccountInput,
  PaginatedDto,
  UpdateAccountInput,
} from './dto.ts';
import {
  accountUiTypeToCategory,
  mapAccountToDto,
} from './mappers.ts';
import { AccountBalanceService } from './balance-service.ts';
import type {
  AccountRepository,
  LedgerRepository,
  TransactionRepository,
} from '../../domain/fin/repositories.ts';
import { createId } from '../../shared/id.ts';
import {
  conflict,
  notFound,
} from '../../shared/errors.ts';
import { includesSearch, paginate, sortByNewest } from '../../shared/pagination.ts';
import { nowIso } from '../../shared/time.ts';
import {
  accountStatuses,
  accountUiTypes,
  balanceTypes,
} from '../../domain/fin/types.ts';
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

export class AccountService {
  accountRepository: AccountRepository;
  ledgerRepository: LedgerRepository;
  transactionRepository: TransactionRepository;
  balanceService: AccountBalanceService;

  constructor(
    accountRepository: AccountRepository,
    ledgerRepository: LedgerRepository,
    transactionRepository: TransactionRepository,
    balanceService: AccountBalanceService,
  ) {
    this.accountRepository = accountRepository;
    this.ledgerRepository = ledgerRepository;
    this.transactionRepository = transactionRepository;
    this.balanceService = balanceService;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<AccountDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: AccountListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      status: optionalEnum(readField(query, 'status'), accountStatuses, 'status'),
      type: optionalEnum(readField(query, 'type'), accountUiTypes, 'type'),
      ledgerId: optionalString(readField(query, 'ledgerId')),
      parentId: optionalString(readField(query, 'parentId')),
      currency: optionalCurrencyCode(readField(query, 'currency')),
      balanceType: optionalEnum(
        readField(query, 'balanceType'),
        balanceTypes,
        'balanceType',
      ),
    };

    const accounts = sortByNewest(await this.accountRepository.listAll(), 'createdAt').filter(
      (account) =>
        includesSearch(
          [account.accountName, account.accountCode, account.description],
          parsedQuery.search,
        ) &&
        (!parsedQuery.status || account.accountStatus === parsedQuery.status) &&
        (!parsedQuery.type ||
          account.accountCategory === accountUiTypeToCategory(parsedQuery.type)) &&
        (!parsedQuery.ledgerId || account.ledgerBookId === parsedQuery.ledgerId) &&
        (!parsedQuery.parentId || account.parentAccountId === parsedQuery.parentId) &&
        (!parsedQuery.currency || account.currencyCode === parsedQuery.currency) &&
        (!parsedQuery.balanceType ||
          account.normalBalance === parsedQuery.balanceType),
    );

    const allAccounts = await this.accountRepository.listAll();
    const allLedgers = await this.ledgerRepository.listAll();
    const balances = await this.balanceService.computeBalanceMap(allAccounts);
    const accountsById = new Map(allAccounts.map((account) => [account.id, account]));
    const ledgersById = new Map(allLedgers.map((ledger) => [ledger.id, ledger]));

    return paginate(
      accounts.map((account) =>
        mapAccountToDto(
          account,
          balances.get(account.id) ?? 0,
          ledgersById,
          accountsById,
        ),
      ),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<AccountDto> {
    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const existing = await this.accountRepository.findByCode(parsedInput.code);
    if (existing) {
      throw conflict('ACCOUNT_CODE_EXISTS', 'Account code already exists', {
        code: parsedInput.code,
      });
    }

    const timestamp = nowIso();
    const account = await this.accountRepository.save({
      id: createId('account'),
      accountCode: parsedInput.code,
      accountName: parsedInput.name,
      accountCategory: accountUiTypeToCategory(parsedInput.type),
      normalBalance: parsedInput.balanceType,
      currencyCode: parsedInput.currency,
      ledgerBookId: parsedInput.ledgerId,
      parentAccountId: parsedInput.parentId ?? null,
      postingLevel: parsedInput.parentId ? 'SUB' : 'MAIN',
      accountStatus: parsedInput.status,
      createdAt: timestamp,
      updatedAt: timestamp,
      description: parsedInput.description ?? null,
    });

    return this.toDto(account.id);
  }

  async update(id: string, input: unknown): Promise<AccountDto> {
    const existing = await this.accountRepository.findById(id);
    if (!existing) {
      throw notFound('ACCOUNT_NOT_FOUND', 'Account not found', { id });
    }

    const parsedInput = await this.parseCreateOrUpdateInput(input, id);
    const codeOwner = await this.accountRepository.findByCode(parsedInput.code);
    if (codeOwner && codeOwner.id !== id) {
      throw conflict('ACCOUNT_CODE_EXISTS', 'Account code already exists', {
        code: parsedInput.code,
      });
    }

    await this.accountRepository.save({
      ...existing,
      accountCode: parsedInput.code,
      accountName: parsedInput.name,
      accountCategory: accountUiTypeToCategory(parsedInput.type),
      normalBalance: parsedInput.balanceType,
      currencyCode: parsedInput.currency,
      ledgerBookId: parsedInput.ledgerId,
      parentAccountId: parsedInput.parentId ?? null,
      postingLevel: parsedInput.parentId ? 'SUB' : 'MAIN',
      accountStatus: parsedInput.status,
      updatedAt: nowIso(),
      description: parsedInput.description ?? null,
    });

    return this.toDto(id);
  }

  async delete(id: string): Promise<void> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      throw notFound('ACCOUNT_NOT_FOUND', 'Account not found', { id });
    }

    const child = (await this.accountRepository.listAll()).find(
      (item) => item.parentAccountId === id,
    );
    if (child) {
      throw conflict('ACCOUNT_HAS_CHILDREN', 'Account has child accounts', {
        id,
        childAccountId: child.id,
      });
    }

    const linkedTransaction = (await this.transactionRepository.listAll()).find(
      (transaction) => transaction.lines.some((line) => line.accountId === id),
    );
    if (linkedTransaction) {
      throw conflict(
        'ACCOUNT_HAS_TRANSACTIONS',
        'Account is referenced by at least one transaction',
        { id, transactionId: linkedTransaction.header.id },
      );
    }

    await this.accountRepository.delete(id);
  }

  private async parseCreateOrUpdateInput(
    input: unknown,
    currentAccountId?: string,
  ): Promise<CreateAccountInput | UpdateAccountInput> {
    const payload = asRecord(input);
    const parsedInput: CreateAccountInput = {
      name: requiredString(readField(payload, 'name'), 'name'),
      code: requiredString(readField(payload, 'code'), 'code').toUpperCase(),
      type: requiredEnum(readField(payload, 'type'), accountUiTypes, 'type'),
      balanceType: requiredEnum(
        readField(payload, 'balanceType'),
        balanceTypes,
        'balanceType',
      ),
      currency: requiredCurrencyCode(readField(payload, 'currency'), 'currency'),
      parentId: optionalString(readField(payload, 'parentId')),
      ledgerId: requiredString(readField(payload, 'ledgerId'), 'ledgerId'),
      status: requiredEnum(readField(payload, 'status'), accountStatuses, 'status'),
      description: optionalString(readField(payload, 'description')),
    };

    const ledger = await this.ledgerRepository.findById(parsedInput.ledgerId);
    if (!ledger) {
      throw notFound('LEDGER_NOT_FOUND', 'Ledger not found', {
        ledgerId: parsedInput.ledgerId,
      });
    }

    if (parsedInput.parentId) {
      if (parsedInput.parentId === currentAccountId) {
        throw conflict(
          'ACCOUNT_PARENT_INVALID',
          'Account cannot use itself as parent',
          { parentId: parsedInput.parentId },
        );
      }

      const parent = await this.accountRepository.findById(parsedInput.parentId);
      if (!parent) {
        throw notFound('ACCOUNT_PARENT_NOT_FOUND', 'Parent account not found', {
          parentId: parsedInput.parentId,
        });
      }

      if (parent.ledgerBookId !== parsedInput.ledgerId) {
        throw conflict(
          'ACCOUNT_LEDGER_MISMATCH',
          'Parent account must belong to the same ledger',
          { parentId: parent.id, ledgerId: parsedInput.ledgerId },
        );
      }
    }

    return parsedInput;
  }

  private async toDto(id: string): Promise<AccountDto> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      throw notFound('ACCOUNT_NOT_FOUND', 'Account not found', { id });
    }

    const allAccounts = await this.accountRepository.listAll();
    const allLedgers = await this.ledgerRepository.listAll();
    const balances = await this.balanceService.computeBalanceMap(allAccounts);
    const accountsById = new Map(allAccounts.map((item) => [item.id, item]));
    const ledgersById = new Map(allLedgers.map((item) => [item.id, item]));

    return mapAccountToDto(
      account,
      balances.get(account.id) ?? 0,
      ledgersById,
      accountsById,
    );
  }
}
