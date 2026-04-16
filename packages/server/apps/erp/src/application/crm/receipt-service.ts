import type {
  CreateReceiptInput,
  PaginatedDto,
  ReceiptDto,
  ReceiptListQuery,
  UpdateReceiptInput,
} from './dto.ts';
import { mapReceiptToDto } from './mappers.ts';
import type { AccountRepository, TransactionRepository } from '../../domain/fin/repositories.ts';
import type {
  CustomerBankAccountRepository,
  CustomerRepository,
  ReceiptOrderRepository,
} from '../../domain/crm/repositories.ts';
import { receiptOrderStatuses } from '../../domain/crm/types.ts';
import { TransactionService } from '../fin/transaction-service.ts';
import { createId, nextSequenceCode } from '../../shared/id.ts';
import { conflict, notFound } from '../../shared/errors.ts';
import {
  includesSearch,
  isWithinDateRange,
  paginate,
  sortByNewest,
} from '../../shared/pagination.ts';
import { roundMoney } from '../../shared/money.ts';
import { nowIso } from '../../shared/time.ts';
import {
  asRecord,
  optionalEnum,
  optionalInteger,
  optionalString,
  readField,
  requiredCurrencyCode,
  requiredDate,
  requiredPositiveNumber,
  requiredString,
} from '../../shared/validation.ts';

export class ReceiptService {
  receiptOrderRepository: ReceiptOrderRepository;
  customerRepository: CustomerRepository;
  customerBankAccountRepository: CustomerBankAccountRepository;
  accountRepository: AccountRepository;
  transactionRepository: TransactionRepository;
  transactionService: TransactionService;

  constructor(
    receiptOrderRepository: ReceiptOrderRepository,
    customerRepository: CustomerRepository,
    customerBankAccountRepository: CustomerBankAccountRepository,
    accountRepository: AccountRepository,
    transactionRepository: TransactionRepository,
    transactionService: TransactionService,
  ) {
    this.receiptOrderRepository = receiptOrderRepository;
    this.customerRepository = customerRepository;
    this.customerBankAccountRepository = customerBankAccountRepository;
    this.accountRepository = accountRepository;
    this.transactionRepository = transactionRepository;
    this.transactionService = transactionService;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<ReceiptDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: ReceiptListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      customerId: optionalString(readField(query, 'customerId')),
      receiptToAccountId: optionalString(readField(query, 'receiptToAccountId')),
      status: optionalEnum(readField(query, 'status'), receiptOrderStatuses, 'status'),
      dateFrom: optionalString(readField(query, 'dateFrom')),
      dateTo: optionalString(readField(query, 'dateTo')),
    };

    const [receipts, customers, customerBankAccounts, accounts, transactions] =
      await Promise.all([
        this.receiptOrderRepository.listAll(),
        this.customerRepository.listAll(),
        this.customerBankAccountRepository.listAll(),
        this.accountRepository.listAll(),
        this.transactionRepository.listAll(),
      ]);

    const customersById = new Map(customers.map((customer) => [customer.id, customer]));
    const filtered = sortByNewest(receipts, 'createdAt').filter((receipt) => {
      return (
        includesSearch(
          [
            receipt.receiptOrderNo,
            receipt.referenceNo,
            receipt.purpose,
            receipt.description,
            customersById.get(receipt.customerId)?.customerName ?? '',
          ],
          parsedQuery.search,
        ) &&
        (!parsedQuery.customerId || receipt.customerId === parsedQuery.customerId) &&
        (!parsedQuery.receiptToAccountId ||
          receipt.receiptToAccountId === parsedQuery.receiptToAccountId) &&
        (!parsedQuery.status || receipt.status === parsedQuery.status) &&
        isWithinDateRange(
          `${receipt.receiptDate}T00:00:00.000Z`,
          parsedQuery.dateFrom,
          parsedQuery.dateTo,
        )
      );
    });

    return paginate(
      filtered.map((receipt) =>
        mapReceiptToDto(
          receipt,
          customersById,
          new Map(customerBankAccounts.map((item) => [item.id, item])),
          new Map(accounts.map((account) => [account.id, account])),
          new Map(transactions.map((transaction) => [transaction.header.id, transaction])),
        ),
      ),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<ReceiptDto> {
    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const receipts = await this.receiptOrderRepository.listAll();
    const receiptOrderNo = parsedInput.receiptOrderNo
      ? parsedInput.receiptOrderNo.toUpperCase()
      : nextSequenceCode(
          'RCT',
          receipts.map((receipt) => receipt.receiptOrderNo),
        );

    const existing = await this.receiptOrderRepository.findByOrderNo(receiptOrderNo);
    if (existing) {
      throw conflict('RECEIPT_ORDER_NO_EXISTS', 'Receipt order number already exists', {
        receiptOrderNo,
      });
    }

    const { ledgerBookId } = await this.resolvePostingContext(parsedInput);
    const timestamp = nowIso();
    const created = await this.receiptOrderRepository.save({
      id: createId('receipt'),
      receiptOrderNo,
      customerId: parsedInput.customerId,
      customerBankAccountId: parsedInput.customerBankAccountId,
      receiptToAccountId: parsedInput.receiptToAccountId,
      revenueAccountId: parsedInput.revenueAccountId,
      ledgerBookId,
      amount: parsedInput.amount,
      currencyCode: parsedInput.currency,
      purpose: parsedInput.purpose,
      receiptDate: parsedInput.receiptDate,
      status: 'DRAFT',
      referenceNo: parsedInput.referenceNo ?? null,
      description: parsedInput.description ?? null,
      linkedTransactionId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      executedAt: null,
    });

    return this.toDto(created.id);
  }

  async update(id: string, input: unknown): Promise<ReceiptDto> {
    const existing = await this.receiptOrderRepository.findById(id);
    if (!existing) {
      throw notFound('RECEIPT_ORDER_NOT_FOUND', 'Receipt order not found', { id });
    }

    if (existing.status !== 'DRAFT') {
      throw conflict(
        'RECEIPT_ORDER_NOT_EDITABLE',
        'Only draft receipt orders can be edited',
        { id, status: existing.status },
      );
    }

    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const receiptOrderNo = parsedInput.receiptOrderNo
      ? parsedInput.receiptOrderNo.toUpperCase()
      : existing.receiptOrderNo;
    const codeOwner = await this.receiptOrderRepository.findByOrderNo(receiptOrderNo);
    if (codeOwner && codeOwner.id !== id) {
      throw conflict('RECEIPT_ORDER_NO_EXISTS', 'Receipt order number already exists', {
        receiptOrderNo,
      });
    }

    const { ledgerBookId } = await this.resolvePostingContext(parsedInput);
    await this.receiptOrderRepository.save({
      ...existing,
      receiptOrderNo,
      customerId: parsedInput.customerId,
      customerBankAccountId: parsedInput.customerBankAccountId,
      receiptToAccountId: parsedInput.receiptToAccountId,
      revenueAccountId: parsedInput.revenueAccountId,
      ledgerBookId,
      amount: parsedInput.amount,
      currencyCode: parsedInput.currency,
      purpose: parsedInput.purpose,
      receiptDate: parsedInput.receiptDate,
      referenceNo: parsedInput.referenceNo ?? null,
      description: parsedInput.description ?? null,
      updatedAt: nowIso(),
    });

    return this.toDto(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.receiptOrderRepository.findById(id);
    if (!existing) {
      throw notFound('RECEIPT_ORDER_NOT_FOUND', 'Receipt order not found', { id });
    }

    if (existing.status !== 'DRAFT') {
      throw conflict(
        'RECEIPT_ORDER_NOT_DELETABLE',
        'Only draft receipt orders can be deleted',
        { id, status: existing.status },
      );
    }

    await this.receiptOrderRepository.delete(id);
  }

  async execute(id: string): Promise<ReceiptDto> {
    const existing = await this.receiptOrderRepository.findById(id);
    if (!existing) {
      throw notFound('RECEIPT_ORDER_NOT_FOUND', 'Receipt order not found', { id });
    }

    if (existing.status !== 'DRAFT') {
      throw conflict(
        'RECEIPT_ORDER_NOT_EXECUTABLE',
        'Only draft receipt orders can be executed',
        { id, status: existing.status },
      );
    }

    await this.resolvePostingContext({
      receiptOrderNo: existing.receiptOrderNo,
      customerId: existing.customerId,
      customerBankAccountId: existing.customerBankAccountId,
      receiptToAccountId: existing.receiptToAccountId,
      revenueAccountId: existing.revenueAccountId,
      amount: existing.amount,
      currency: existing.currencyCode,
      purpose: existing.purpose,
      receiptDate: existing.receiptDate,
      referenceNo: existing.referenceNo,
      description: existing.description,
    });

    const customer = await this.customerRepository.findById(existing.customerId);
    const description =
      existing.description ??
      `Customer receipt from ${customer?.customerName ?? existing.customerId}: ${existing.purpose}`;

    const transaction = await this.transactionService.create({
      type: 'RECEIPT',
      amount: existing.amount,
      debitAccountId: existing.receiptToAccountId,
      creditAccountId: existing.revenueAccountId,
      ledgerId: existing.ledgerBookId,
      transactionDate: existing.receiptDate,
      referenceNo: existing.referenceNo ?? existing.receiptOrderNo,
      description,
      currency: existing.currencyCode,
      sourceType: 'RECEIPT_ORDER',
      sourceId: existing.id,
    });

    const postedTransaction = await this.transactionService.post(transaction.id);
    await this.receiptOrderRepository.save({
      ...existing,
      status: 'EXECUTED',
      linkedTransactionId: postedTransaction.id,
      executedAt: nowIso(),
      updatedAt: nowIso(),
    });

    return this.toDto(id);
  }

  private async parseCreateOrUpdateInput(
    input: unknown,
  ): Promise<CreateReceiptInput | UpdateReceiptInput> {
    const payload = asRecord(input);

    return {
      receiptOrderNo: optionalString(readField(payload, 'receiptOrderNo')),
      customerId: requiredString(readField(payload, 'customerId'), 'customerId'),
      customerBankAccountId: requiredString(
        readField(payload, 'customerBankAccountId'),
        'customerBankAccountId',
      ),
      receiptToAccountId: requiredString(
        readField(payload, 'receiptToAccountId'),
        'receiptToAccountId',
      ),
      revenueAccountId: requiredString(
        readField(payload, 'revenueAccountId'),
        'revenueAccountId',
      ),
      amount: roundMoney(
        requiredPositiveNumber(readField(payload, 'amount'), 'amount'),
      ),
      currency: requiredCurrencyCode(readField(payload, 'currency'), 'currency'),
      purpose: requiredString(readField(payload, 'purpose'), 'purpose'),
      receiptDate: requiredDate(readField(payload, 'receiptDate'), 'receiptDate'),
      referenceNo: optionalString(readField(payload, 'referenceNo')),
      description: optionalString(readField(payload, 'description')),
    };
  }

  private async resolvePostingContext(input: CreateReceiptInput | UpdateReceiptInput) {
    const [customer, customerBankAccount, receiptToAccount, revenueAccount] =
      await Promise.all([
        this.customerRepository.findById(input.customerId),
        this.customerBankAccountRepository.findById(input.customerBankAccountId),
        this.accountRepository.findById(input.receiptToAccountId),
        this.accountRepository.findById(input.revenueAccountId),
      ]);

    if (!customer) {
      throw notFound('CUSTOMER_NOT_FOUND', 'Customer not found', {
        customerId: input.customerId,
      });
    }

    if (!customerBankAccount) {
      throw notFound(
        'CUSTOMER_BANK_ACCOUNT_NOT_FOUND',
        'Customer bank account not found',
        { customerBankAccountId: input.customerBankAccountId },
      );
    }

    if (customerBankAccount.customerId !== input.customerId) {
      throw conflict(
        'RECEIPT_CUSTOMER_BANK_ACCOUNT_MISMATCH',
        'Selected customer bank account does not belong to the customer',
        {
          customerId: input.customerId,
          customerBankAccountId: input.customerBankAccountId,
        },
      );
    }

    if (!receiptToAccount) {
      throw notFound('ACCOUNT_NOT_FOUND', 'Receipt-to account not found', {
        accountId: input.receiptToAccountId,
      });
    }

    if (!revenueAccount) {
      throw notFound('ACCOUNT_NOT_FOUND', 'Revenue account not found', {
        accountId: input.revenueAccountId,
      });
    }

    if (input.receiptToAccountId === input.revenueAccountId) {
      throw conflict(
        'RECEIPT_ACCOUNTS_DUPLICATED',
        'Receipt-to account and revenue account must be different',
        {
          receiptToAccountId: input.receiptToAccountId,
          revenueAccountId: input.revenueAccountId,
        },
      );
    }

    if (receiptToAccount.ledgerBookId !== revenueAccount.ledgerBookId) {
      throw conflict(
        'RECEIPT_LEDGER_MISMATCH',
        'Receipt-to account and revenue account must belong to the same ledger',
        {
          receiptToLedgerId: receiptToAccount.ledgerBookId,
          revenueLedgerId: revenueAccount.ledgerBookId,
        },
      );
    }

    if (
      input.currency !== receiptToAccount.currencyCode ||
      input.currency !== revenueAccount.currencyCode ||
      input.currency !== customerBankAccount.currencyCode
    ) {
      throw conflict(
        'RECEIPT_CURRENCY_MISMATCH',
        'Receipt currency must match customer bank account and both finance accounts',
        {
          currency: input.currency,
          customerBankAccountCurrency: customerBankAccount.currencyCode,
          receiptToAccountCurrency: receiptToAccount.currencyCode,
          revenueAccountCurrency: revenueAccount.currencyCode,
        },
      );
    }

    return {
      customer,
      customerBankAccount,
      receiptToAccount,
      revenueAccount,
      ledgerBookId: receiptToAccount.ledgerBookId,
    };
  }

  private async toDto(id: string): Promise<ReceiptDto> {
    const receipt = await this.receiptOrderRepository.findById(id);
    if (!receipt) {
      throw notFound('RECEIPT_ORDER_NOT_FOUND', 'Receipt order not found', { id });
    }

    const [customers, customerBankAccounts, accounts, transactions] = await Promise.all([
      this.customerRepository.listAll(),
      this.customerBankAccountRepository.listAll(),
      this.accountRepository.listAll(),
      this.transactionRepository.listAll(),
    ]);

    return mapReceiptToDto(
      receipt,
      new Map(customers.map((customer) => [customer.id, customer])),
      new Map(customerBankAccounts.map((item) => [item.id, item])),
      new Map(accounts.map((account) => [account.id, account])),
      new Map(transactions.map((transaction) => [transaction.header.id, transaction])),
    );
  }
}
