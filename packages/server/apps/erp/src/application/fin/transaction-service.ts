import type {
  CreateTransactionInput,
  PaginatedDto,
  TransactionDto,
  TransactionListQuery,
  UpdateTransactionInput,
} from './dto.ts';
import { mapTransactionToDto } from './mappers.ts';
import type {
  AccountRepository,
  LedgerRepository,
  TransactionRepository,
} from '../../domain/fin/repositories.ts';
import type { TransactionLine } from '../../domain/fin/types.ts';
import { createId, nextSequenceCode } from '../../shared/id.ts';
import {
  conflict,
  notFound,
} from '../../shared/errors.ts';
import {
  includesSearch,
  isWithinDateRange,
  paginate,
} from '../../shared/pagination.ts';
import { nowIso } from '../../shared/time.ts';
import { roundMoney } from '../../shared/money.ts';
import {
  asRecord,
  optionalCurrencyCode,
  optionalEnum,
  optionalInteger,
  optionalString,
  readField,
  requiredDate,
  requiredEnum,
  requiredPositiveNumber,
  requiredString,
} from '../../shared/validation.ts';
import {
  transactionBusinessTypes,
  transactionStatuses,
} from '../../domain/fin/types.ts';

export class TransactionService {
  transactionRepository: TransactionRepository;
  ledgerRepository: LedgerRepository;
  accountRepository: AccountRepository;

  constructor(
    transactionRepository: TransactionRepository,
    ledgerRepository: LedgerRepository,
    accountRepository: AccountRepository,
  ) {
    this.transactionRepository = transactionRepository;
    this.ledgerRepository = ledgerRepository;
    this.accountRepository = accountRepository;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<TransactionDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: TransactionListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      status: optionalEnum(readField(query, 'status'), transactionStatuses, 'status'),
      type: optionalEnum(readField(query, 'type'), transactionBusinessTypes, 'type'),
      ledgerId: optionalString(readField(query, 'ledgerId')),
      debitAccountId: optionalString(readField(query, 'debitAccountId')),
      creditAccountId: optionalString(readField(query, 'creditAccountId')),
      dateFrom: optionalString(readField(query, 'dateFrom')),
      dateTo: optionalString(readField(query, 'dateTo')),
    };

    const transactions = (await this.transactionRepository.listAll()).sort((left, right) => {
      return (
        new Date(right.header.createdAt).getTime() -
        new Date(left.header.createdAt).getTime()
      );
    });

    const filtered = transactions.filter((transaction) => {
      const debitLine = transaction.lines.find((line) => line.entryType === 'DEBIT');
      const creditLine = transaction.lines.find((line) => line.entryType === 'CREDIT');

      return (
        includesSearch(
          [
            transaction.header.code,
            transaction.header.referenceNo,
            transaction.header.description,
          ],
          parsedQuery.search,
        ) &&
        (!parsedQuery.status || transaction.header.status === parsedQuery.status) &&
        (!parsedQuery.type || transaction.header.businessType === parsedQuery.type) &&
        (!parsedQuery.ledgerId ||
          transaction.header.ledgerBookId === parsedQuery.ledgerId) &&
        (!parsedQuery.debitAccountId ||
          debitLine?.accountId === parsedQuery.debitAccountId) &&
        (!parsedQuery.creditAccountId ||
          creditLine?.accountId === parsedQuery.creditAccountId) &&
        isWithinDateRange(
          `${transaction.header.transactionDate}T00:00:00.000Z`,
          parsedQuery.dateFrom,
          parsedQuery.dateTo,
        )
      );
    });

    const accounts = await this.accountRepository.listAll();
    const ledgers = await this.ledgerRepository.listAll();
    const accountsById = new Map(accounts.map((account) => [account.id, account]));
    const ledgersById = new Map(ledgers.map((ledger) => [ledger.id, ledger]));

    return paginate(
      filtered.map((transaction) =>
        mapTransactionToDto(transaction, accountsById, ledgersById),
      ),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<TransactionDto> {
    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const transactions = await this.transactionRepository.listAll();
    const code = parsedInput.code
      ? parsedInput.code.toUpperCase()
      : nextSequenceCode(
          'TRX',
          transactions.map((transaction) => transaction.header.code),
        );

    const existing = await this.transactionRepository.findByCode(code);
    if (existing) {
      throw conflict('TRANSACTION_CODE_EXISTS', 'Transaction code already exists', {
        code,
      });
    }

    const transactionId = createId('txn');
    const timestamp = nowIso();
    await this.transactionRepository.save({
      header: {
        id: transactionId,
        code,
        businessType: parsedInput.type,
        sourceType: parsedInput.sourceType ?? 'UI',
        sourceId: parsedInput.sourceId ?? null,
        ledgerBookId: parsedInput.ledgerId,
        transactionDate: parsedInput.transactionDate,
        description: parsedInput.description ?? null,
        referenceNo: parsedInput.referenceNo ?? null,
        status: 'PENDING',
        createdAt: timestamp,
        updatedAt: timestamp,
        postedAt: null,
        unpostedAt: null,
      },
      lines: [
        {
          id: createId('txnline'),
          transactionId,
          entryType: 'DEBIT',
          accountId: parsedInput.debitAccountId,
          amount: parsedInput.amount,
          currencyCode: parsedInput.currency!,
          lineNo: 1,
        },
        {
          id: createId('txnline'),
          transactionId,
          entryType: 'CREDIT',
          accountId: parsedInput.creditAccountId,
          amount: parsedInput.amount,
          currencyCode: parsedInput.currency!,
          lineNo: 2,
        },
      ],
    });

    const created = await this.transactionRepository.findById(transactionId);
    if (!created) {
      throw notFound('TRANSACTION_NOT_FOUND', 'Transaction not found after creation', {
        id: transactionId,
      });
    }

    return this.toDto(created.header.id);
  }

  async update(id: string, input: unknown): Promise<TransactionDto> {
    const existing = await this.transactionRepository.findById(id);
    if (!existing) {
      throw notFound('TRANSACTION_NOT_FOUND', 'Transaction not found', { id });
    }

    if (existing.header.status !== 'PENDING') {
      throw conflict(
        'TRANSACTION_NOT_EDITABLE',
        'Only pending transactions can be edited',
        { id, status: existing.header.status },
      );
    }

    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const code = parsedInput.code
      ? parsedInput.code.toUpperCase()
      : existing.header.code;
    const codeOwner = await this.transactionRepository.findByCode(code);
    if (codeOwner && codeOwner.header.id !== id) {
      throw conflict('TRANSACTION_CODE_EXISTS', 'Transaction code already exists', {
        code,
      });
    }

    const debitLine = this.findLineByEntryType(existing.lines, 'DEBIT');
    const creditLine = this.findLineByEntryType(existing.lines, 'CREDIT');

    await this.transactionRepository.save({
      header: {
        ...existing.header,
        code,
        businessType: parsedInput.type,
        ledgerBookId: parsedInput.ledgerId,
        transactionDate: parsedInput.transactionDate,
        description: parsedInput.description ?? null,
        referenceNo: parsedInput.referenceNo ?? null,
        updatedAt: nowIso(),
      },
      lines: [
        {
          id: debitLine?.id ?? createId('txnline'),
          transactionId: id,
          entryType: 'DEBIT',
          accountId: parsedInput.debitAccountId,
          amount: parsedInput.amount,
          currencyCode: parsedInput.currency!,
          lineNo: 1,
        },
        {
          id: creditLine?.id ?? createId('txnline'),
          transactionId: id,
          entryType: 'CREDIT',
          accountId: parsedInput.creditAccountId,
          amount: parsedInput.amount,
          currencyCode: parsedInput.currency!,
          lineNo: 2,
        },
      ],
    });

    return this.toDto(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.transactionRepository.findById(id);
    if (!existing) {
      throw notFound('TRANSACTION_NOT_FOUND', 'Transaction not found', { id });
    }

    if (existing.header.status === 'POSTED') {
      throw conflict(
        'TRANSACTION_NOT_DELETABLE',
        'Posted transactions cannot be deleted',
        { id },
      );
    }

    await this.transactionRepository.delete(id);
  }

  async post(id: string): Promise<TransactionDto> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw notFound('TRANSACTION_NOT_FOUND', 'Transaction not found', { id });
    }

    if (transaction.header.status === 'POSTED') {
      throw conflict(
        'TRANSACTION_ALREADY_POSTED',
        'Transaction has already been posted',
        { id },
      );
    }

    if (transaction.header.status === 'CANCELLED') {
      throw conflict(
        'TRANSACTION_CANCELLED',
        'Cancelled transactions cannot be posted again',
        { id },
      );
    }

    await this.ensureLedgerAndAccountsStillExist(
      transaction.header.ledgerBookId,
      transaction.lines[0]?.accountId ?? '',
      transaction.lines[1]?.accountId ?? '',
    );

    await this.transactionRepository.save({
      ...transaction,
      header: {
        ...transaction.header,
        status: 'POSTED',
        postedAt: nowIso(),
        updatedAt: nowIso(),
      },
    });

    return this.toDto(id);
  }

  async unpost(id: string): Promise<TransactionDto> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw notFound('TRANSACTION_NOT_FOUND', 'Transaction not found', { id });
    }

    if (transaction.header.status !== 'POSTED') {
      throw conflict(
        'TRANSACTION_NOT_POSTED',
        'Only posted transactions can be cancelled',
        { id, status: transaction.header.status },
      );
    }

    await this.transactionRepository.save({
      ...transaction,
      header: {
        ...transaction.header,
        status: 'CANCELLED',
        unpostedAt: nowIso(),
        updatedAt: nowIso(),
      },
    });

    return this.toDto(id);
  }

  private findLineByEntryType(
    lines: TransactionLine[],
    entryType: TransactionLine['entryType'],
  ): TransactionLine | undefined {
    return lines.find((line) => line.entryType === entryType);
  }

  private async parseCreateOrUpdateInput(
    input: unknown,
  ): Promise<CreateTransactionInput | UpdateTransactionInput> {
    const payload = asRecord(input);
    const parsedInput: CreateTransactionInput = {
      code: optionalString(readField(payload, 'code')),
      type: requiredEnum(readField(payload, 'type'), transactionBusinessTypes, 'type'),
      amount: roundMoney(
        requiredPositiveNumber(readField(payload, 'amount'), 'amount'),
      ),
      debitAccountId: requiredString(
        readField(payload, 'debitAccountId'),
        'debitAccountId',
      ),
      creditAccountId: requiredString(
        readField(payload, 'creditAccountId'),
        'creditAccountId',
      ),
      ledgerId: requiredString(readField(payload, 'ledgerId'), 'ledgerId'),
      transactionDate: requiredDate(
        readField(payload, 'transactionDate'),
        'transactionDate',
      ),
      referenceNo: optionalString(readField(payload, 'referenceNo')),
      description: optionalString(readField(payload, 'description')),
      currency: optionalCurrencyCode(readField(payload, 'currency')),
      sourceType: optionalString(readField(payload, 'sourceType')),
      sourceId: optionalString(readField(payload, 'sourceId')),
    };

    if (parsedInput.debitAccountId === parsedInput.creditAccountId) {
      throw conflict(
        'TRANSACTION_ACCOUNTS_DUPLICATED',
        'Debit and credit accounts must be different',
        {
          debitAccountId: parsedInput.debitAccountId,
          creditAccountId: parsedInput.creditAccountId,
        },
      );
    }

    await this.ensureLedgerAndAccountsStillExist(
      parsedInput.ledgerId,
      parsedInput.debitAccountId,
      parsedInput.creditAccountId,
    );

    const debitAccount = await this.accountRepository.findById(parsedInput.debitAccountId);
    const creditAccount = await this.accountRepository.findById(parsedInput.creditAccountId);

    if (!debitAccount || !creditAccount) {
      throw notFound('ACCOUNT_NOT_FOUND', 'Transaction account not found');
    }

    const currency = parsedInput.currency ?? debitAccount.currencyCode;
    if (currency !== debitAccount.currencyCode || currency !== creditAccount.currencyCode) {
      throw conflict(
        'TRANSACTION_CURRENCY_MISMATCH',
        'Transaction currency must match both accounts',
        {
          currency,
          debitAccountCurrency: debitAccount.currencyCode,
          creditAccountCurrency: creditAccount.currencyCode,
        },
      );
    }

    parsedInput.currency = currency;
    return parsedInput;
  }

  private async ensureLedgerAndAccountsStillExist(
    ledgerId: string,
    debitAccountId: string,
    creditAccountId: string,
  ): Promise<void> {
    const ledger = await this.ledgerRepository.findById(ledgerId);
    if (!ledger) {
      throw notFound('LEDGER_NOT_FOUND', 'Ledger not found', { ledgerId });
    }

    const debitAccount = await this.accountRepository.findById(debitAccountId);
    if (!debitAccount) {
      throw notFound('ACCOUNT_NOT_FOUND', 'Debit account not found', {
        accountId: debitAccountId,
      });
    }

    const creditAccount = await this.accountRepository.findById(creditAccountId);
    if (!creditAccount) {
      throw notFound('ACCOUNT_NOT_FOUND', 'Credit account not found', {
        accountId: creditAccountId,
      });
    }

    if (
      debitAccount.ledgerBookId !== ledgerId ||
      creditAccount.ledgerBookId !== ledgerId
    ) {
      throw conflict(
        'TRANSACTION_LEDGER_MISMATCH',
        'Both accounts must belong to the selected ledger',
        {
          ledgerId,
          debitAccountLedgerId: debitAccount.ledgerBookId,
          creditAccountLedgerId: creditAccount.ledgerBookId,
        },
      );
    }
  }

  private async toDto(id: string): Promise<TransactionDto> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw notFound('TRANSACTION_NOT_FOUND', 'Transaction not found', { id });
    }

    const accounts = await this.accountRepository.listAll();
    const ledgers = await this.ledgerRepository.listAll();
    const accountsById = new Map(accounts.map((account) => [account.id, account]));
    const ledgersById = new Map(ledgers.map((ledger) => [ledger.id, ledger]));

    return mapTransactionToDto(transaction, accountsById, ledgersById);
  }
}
