import type {
  CreatePaymentInput,
  PaginatedDto,
  PaymentDto,
  PaymentListQuery,
  UpdatePaymentInput,
} from './dto.ts';
import { mapPaymentToDto } from './mappers.ts';
import type { AccountRepository, TransactionRepository } from '../../domain/fin/repositories.ts';
import type {
  PaymentOrderRepository,
  VendorBankAccountRepository,
  VendorRepository,
} from '../../domain/procurement/repositories.ts';
import { paymentOrderStatuses } from '../../domain/procurement/types.ts';
import { TransactionService } from '../fin/transaction-service.ts';
import { createId, nextSequenceCode } from '../../shared/id.ts';
import { badRequest, conflict, notFound } from '../../shared/errors.ts';
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

export class PaymentService {
  paymentOrderRepository: PaymentOrderRepository;
  vendorRepository: VendorRepository;
  vendorBankAccountRepository: VendorBankAccountRepository;
  accountRepository: AccountRepository;
  transactionRepository: TransactionRepository;
  transactionService: TransactionService;

  constructor(
    paymentOrderRepository: PaymentOrderRepository,
    vendorRepository: VendorRepository,
    vendorBankAccountRepository: VendorBankAccountRepository,
    accountRepository: AccountRepository,
    transactionRepository: TransactionRepository,
    transactionService: TransactionService,
  ) {
    this.paymentOrderRepository = paymentOrderRepository;
    this.vendorRepository = vendorRepository;
    this.vendorBankAccountRepository = vendorBankAccountRepository;
    this.accountRepository = accountRepository;
    this.transactionRepository = transactionRepository;
    this.transactionService = transactionService;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<PaymentDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: PaymentListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      vendorId: optionalString(readField(query, 'vendorId')),
      payFromAccountId: optionalString(readField(query, 'payFromAccountId')),
      status: optionalEnum(readField(query, 'status'), paymentOrderStatuses, 'status'),
      dateFrom: optionalString(readField(query, 'dateFrom')),
      dateTo: optionalString(readField(query, 'dateTo')),
    };

    const [payments, vendors, vendorBankAccounts, accounts, transactions] =
      await Promise.all([
        this.paymentOrderRepository.listAll(),
        this.vendorRepository.listAll(),
        this.vendorBankAccountRepository.listAll(),
        this.accountRepository.listAll(),
        this.transactionRepository.listAll(),
      ]);

    const vendorsById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
    const filtered = sortByNewest(payments, 'createdAt').filter((payment) => {
      return (
        payment.payeeType === 'VENDOR' &&
        includesSearch(
          [
            payment.paymentOrderNo,
            payment.referenceNo,
            payment.purpose,
            payment.description,
            payment.vendorId
              ? (vendorsById.get(payment.vendorId)?.vendorName ?? '')
              : '',
          ],
          parsedQuery.search,
        ) &&
        (!parsedQuery.vendorId || payment.vendorId === parsedQuery.vendorId) &&
        (!parsedQuery.payFromAccountId ||
          payment.payFromAccountId === parsedQuery.payFromAccountId) &&
        (!parsedQuery.status || payment.status === parsedQuery.status) &&
        isWithinDateRange(
          `${payment.paymentDate}T00:00:00.000Z`,
          parsedQuery.dateFrom,
          parsedQuery.dateTo,
        )
      );
    });

    return paginate(
      filtered.map((payment) =>
        mapPaymentToDto(
          payment,
          vendorsById,
          new Map(vendorBankAccounts.map((item) => [item.id, item])),
          new Map(accounts.map((account) => [account.id, account])),
          new Map(transactions.map((transaction) => [transaction.header.id, transaction])),
        ),
      ),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<PaymentDto> {
    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const payments = await this.paymentOrderRepository.listAll();
    const paymentOrderNo = parsedInput.paymentOrderNo
      ? parsedInput.paymentOrderNo.toUpperCase()
      : nextSequenceCode(
          'PMT',
          payments.map((payment) => payment.paymentOrderNo),
        );

    const existing = await this.paymentOrderRepository.findByOrderNo(paymentOrderNo);
    if (existing) {
      throw conflict('PAYMENT_ORDER_NO_EXISTS', 'Payment order number already exists', {
        paymentOrderNo,
      });
    }

    const { ledgerBookId } = await this.resolvePostingContext(parsedInput);
    const timestamp = nowIso();
    const created = await this.paymentOrderRepository.save({
      id: createId('payment'),
      paymentOrderNo,
      payeeType: 'VENDOR',
      vendorId: parsedInput.vendorId,
      vendorBankAccountId: parsedInput.vendorBankAccountId,
      employeeId: null,
      payFromAccountId: parsedInput.payFromAccountId,
      expenseAccountId: parsedInput.expenseAccountId,
      ledgerBookId,
      amount: parsedInput.amount,
      currencyCode: parsedInput.currency,
      purpose: parsedInput.purpose,
      paymentDate: parsedInput.paymentDate,
      status: 'DRAFT',
      referenceNo: parsedInput.referenceNo ?? null,
      description: parsedInput.description ?? null,
      sourceType: 'UI',
      sourceId: null,
      linkedTransactionId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      executedAt: null,
    });

    return this.toDto(created.id);
  }

  async update(id: string, input: unknown): Promise<PaymentDto> {
    const existing = await this.paymentOrderRepository.findById(id);
    if (!existing) {
      throw notFound('PAYMENT_ORDER_NOT_FOUND', 'Payment order not found', { id });
    }

    if (existing.status !== 'DRAFT') {
      throw conflict(
        'PAYMENT_ORDER_NOT_EDITABLE',
        'Only draft payment orders can be edited',
        { id, status: existing.status },
      );
    }

    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const paymentOrderNo = parsedInput.paymentOrderNo
      ? parsedInput.paymentOrderNo.toUpperCase()
      : existing.paymentOrderNo;
    const codeOwner = await this.paymentOrderRepository.findByOrderNo(paymentOrderNo);
    if (codeOwner && codeOwner.id !== id) {
      throw conflict('PAYMENT_ORDER_NO_EXISTS', 'Payment order number already exists', {
        paymentOrderNo,
      });
    }

    const { ledgerBookId } = await this.resolvePostingContext(parsedInput);
    await this.paymentOrderRepository.save({
      ...existing,
      payeeType: 'VENDOR',
      paymentOrderNo,
      vendorId: parsedInput.vendorId,
      vendorBankAccountId: parsedInput.vendorBankAccountId,
      employeeId: null,
      payFromAccountId: parsedInput.payFromAccountId,
      expenseAccountId: parsedInput.expenseAccountId,
      ledgerBookId,
      amount: parsedInput.amount,
      currencyCode: parsedInput.currency,
      purpose: parsedInput.purpose,
      paymentDate: parsedInput.paymentDate,
      referenceNo: parsedInput.referenceNo ?? null,
      description: parsedInput.description ?? null,
      updatedAt: nowIso(),
    });

    return this.toDto(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.paymentOrderRepository.findById(id);
    if (!existing) {
      throw notFound('PAYMENT_ORDER_NOT_FOUND', 'Payment order not found', { id });
    }

    if (existing.status !== 'DRAFT') {
      throw conflict(
        'PAYMENT_ORDER_NOT_DELETABLE',
        'Only draft payment orders can be deleted',
        { id, status: existing.status },
      );
    }

    await this.paymentOrderRepository.delete(id);
  }

  async execute(id: string): Promise<PaymentDto> {
    const existing = await this.paymentOrderRepository.findById(id);
    if (!existing) {
      throw notFound('PAYMENT_ORDER_NOT_FOUND', 'Payment order not found', { id });
    }

    if (existing.status !== 'DRAFT') {
      throw conflict(
        'PAYMENT_ORDER_NOT_EXECUTABLE',
        'Only draft payment orders can be executed',
        { id, status: existing.status },
      );
    }

    if (existing.payeeType && existing.payeeType !== 'VENDOR') {
      throw conflict(
        'PAYMENT_ORDER_NOT_EXECUTABLE_FROM_PROCUREMENT',
        'Only vendor payment orders can be executed from procurement',
        { id, payeeType: existing.payeeType },
      );
    }

    await this.resolvePostingContext({
      paymentOrderNo: existing.paymentOrderNo,
      vendorId: existing.vendorId ?? '',
      vendorBankAccountId: existing.vendorBankAccountId ?? '',
      payFromAccountId: existing.payFromAccountId,
      expenseAccountId: existing.expenseAccountId,
      amount: existing.amount,
      currency: existing.currencyCode,
      purpose: existing.purpose,
      paymentDate: existing.paymentDate,
      referenceNo: existing.referenceNo,
      description: existing.description,
    });

    const vendor = existing.vendorId
      ? await this.vendorRepository.findById(existing.vendorId)
      : null;
    const description =
      existing.description ??
      `Vendor payment for ${vendor?.vendorName ?? existing.vendorId ?? existing.paymentOrderNo}: ${existing.purpose}`;

    const transaction = await this.transactionService.create({
      type: 'PAYMENT',
      amount: existing.amount,
      debitAccountId: existing.expenseAccountId,
      creditAccountId: existing.payFromAccountId,
      ledgerId: existing.ledgerBookId,
      transactionDate: existing.paymentDate,
      referenceNo: existing.referenceNo ?? existing.paymentOrderNo,
      description,
      currency: existing.currencyCode,
      sourceType: 'PAYMENT_ORDER',
      sourceId: existing.id,
    });

    const postedTransaction = await this.transactionService.post(transaction.id);
    await this.paymentOrderRepository.save({
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
  ): Promise<CreatePaymentInput | UpdatePaymentInput> {
    const payload = asRecord(input);

    return {
      paymentOrderNo: optionalString(readField(payload, 'paymentOrderNo')),
      vendorId: requiredString(readField(payload, 'vendorId'), 'vendorId'),
      vendorBankAccountId: requiredString(
        readField(payload, 'vendorBankAccountId'),
        'vendorBankAccountId',
      ),
      payFromAccountId: requiredString(
        readField(payload, 'payFromAccountId'),
        'payFromAccountId',
      ),
      expenseAccountId: requiredString(
        readField(payload, 'expenseAccountId'),
        'expenseAccountId',
      ),
      amount: roundMoney(
        requiredPositiveNumber(readField(payload, 'amount'), 'amount'),
      ),
      currency: requiredCurrencyCode(readField(payload, 'currency'), 'currency'),
      purpose: requiredString(readField(payload, 'purpose'), 'purpose'),
      paymentDate: requiredDate(readField(payload, 'paymentDate'), 'paymentDate'),
      referenceNo: optionalString(readField(payload, 'referenceNo')),
      description: optionalString(readField(payload, 'description')),
    };
  }

  private async resolvePostingContext(input: CreatePaymentInput | UpdatePaymentInput) {
    const [vendor, vendorBankAccount, payFromAccount, expenseAccount] = await Promise.all([
      this.vendorRepository.findById(input.vendorId),
      this.vendorBankAccountRepository.findById(input.vendorBankAccountId),
      this.accountRepository.findById(input.payFromAccountId),
      this.accountRepository.findById(input.expenseAccountId),
    ]);

    if (!vendor) {
      throw notFound('VENDOR_NOT_FOUND', 'Vendor not found', { vendorId: input.vendorId });
    }

    if (!vendorBankAccount) {
      throw notFound(
        'VENDOR_BANK_ACCOUNT_NOT_FOUND',
        'Vendor bank account not found',
        { vendorBankAccountId: input.vendorBankAccountId },
      );
    }

    if (vendorBankAccount.vendorId !== input.vendorId) {
      throw conflict(
        'PAYMENT_VENDOR_BANK_ACCOUNT_MISMATCH',
        'Selected vendor bank account does not belong to the vendor',
        {
          vendorId: input.vendorId,
          vendorBankAccountId: input.vendorBankAccountId,
        },
      );
    }

    if (!payFromAccount) {
      throw notFound('ACCOUNT_NOT_FOUND', 'Pay-from account not found', {
        accountId: input.payFromAccountId,
      });
    }

    if (!expenseAccount) {
      throw notFound('ACCOUNT_NOT_FOUND', 'Expense account not found', {
        accountId: input.expenseAccountId,
      });
    }

    if (payFromAccount.accountCategory !== 'ASSET') {
      throw badRequest(
        'PAYMENT_PAY_FROM_ACCOUNT_INVALID',
        'Pay-from account must be an asset-type account',
        {
          accountId: input.payFromAccountId,
          accountCategory: payFromAccount.accountCategory,
        },
      );
    }

    if (expenseAccount.accountCategory !== 'EXPENSE') {
      throw badRequest(
        'PAYMENT_EXPENSE_ACCOUNT_INVALID',
        'Expense account must be an expense-type account',
        {
          accountId: input.expenseAccountId,
          accountCategory: expenseAccount.accountCategory,
        },
      );
    }

    if (input.payFromAccountId === input.expenseAccountId) {
      throw conflict(
        'PAYMENT_ACCOUNTS_DUPLICATED',
        'Pay-from account and expense account must be different',
        {
          payFromAccountId: input.payFromAccountId,
          expenseAccountId: input.expenseAccountId,
        },
      );
    }

    if (payFromAccount.ledgerBookId !== expenseAccount.ledgerBookId) {
      throw conflict(
        'PAYMENT_LEDGER_MISMATCH',
        'Pay-from account and expense account must belong to the same ledger',
        {
          payFromLedgerId: payFromAccount.ledgerBookId,
          expenseLedgerId: expenseAccount.ledgerBookId,
        },
      );
    }

    if (
      input.currency !== payFromAccount.currencyCode ||
      input.currency !== expenseAccount.currencyCode ||
      input.currency !== vendorBankAccount.currencyCode
    ) {
      throw conflict(
        'PAYMENT_CURRENCY_MISMATCH',
        'Payment currency must match vendor bank account and both finance accounts',
        {
          currency: input.currency,
          vendorBankAccountCurrency: vendorBankAccount.currencyCode,
          payFromAccountCurrency: payFromAccount.currencyCode,
          expenseAccountCurrency: expenseAccount.currencyCode,
        },
      );
    }

    return {
      vendor,
      vendorBankAccount,
      payFromAccount,
      expenseAccount,
      ledgerBookId: payFromAccount.ledgerBookId,
    };
  }

  private async toDto(id: string): Promise<PaymentDto> {
    const payment = await this.paymentOrderRepository.findById(id);
    if (!payment) {
      throw notFound('PAYMENT_ORDER_NOT_FOUND', 'Payment order not found', { id });
    }

    const [vendors, vendorBankAccounts, accounts, transactions] = await Promise.all([
      this.vendorRepository.listAll(),
      this.vendorBankAccountRepository.listAll(),
      this.accountRepository.listAll(),
      this.transactionRepository.listAll(),
    ]);

    return mapPaymentToDto(
      payment,
      new Map(vendors.map((vendor) => [vendor.id, vendor])),
      new Map(vendorBankAccounts.map((item) => [item.id, item])),
      new Map(accounts.map((account) => [account.id, account])),
      new Map(transactions.map((transaction) => [transaction.header.id, transaction])),
    );
  }
}
