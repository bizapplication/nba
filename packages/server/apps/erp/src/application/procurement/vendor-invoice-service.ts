import type {
  CreateVendorInvoiceInput,
  PaginatedDto,
  UpdateVendorInvoiceInput,
  VendorInvoiceDto,
  VendorInvoiceListQuery,
} from './dto.ts';
import { mapVendorInvoiceToDto } from './mappers.ts';
import type { AccountRepository, TransactionRepository } from '../../domain/fin/repositories.ts';
import type {
  GoodsReceiptRepository,
  PaymentOrderRepository,
  PurchaseOrderRepository,
  VendorBankAccountRepository,
  VendorInvoiceRepository,
  VendorRepository,
} from '../../domain/procurement/repositories.ts';
import { vendorInvoiceStatuses } from '../../domain/procurement/types.ts';
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

export class VendorInvoiceService {
  vendorInvoiceRepository: VendorInvoiceRepository;
  vendorRepository: VendorRepository;
  purchaseOrderRepository: PurchaseOrderRepository;
  goodsReceiptRepository: GoodsReceiptRepository;
  vendorBankAccountRepository: VendorBankAccountRepository;
  paymentOrderRepository: PaymentOrderRepository;
  accountRepository: AccountRepository;
  transactionRepository: TransactionRepository;
  transactionService: TransactionService;

  constructor(
    vendorInvoiceRepository: VendorInvoiceRepository,
    vendorRepository: VendorRepository,
    purchaseOrderRepository: PurchaseOrderRepository,
    goodsReceiptRepository: GoodsReceiptRepository,
    vendorBankAccountRepository: VendorBankAccountRepository,
    paymentOrderRepository: PaymentOrderRepository,
    accountRepository: AccountRepository,
    transactionRepository: TransactionRepository,
    transactionService: TransactionService,
  ) {
    this.vendorInvoiceRepository = vendorInvoiceRepository;
    this.vendorRepository = vendorRepository;
    this.purchaseOrderRepository = purchaseOrderRepository;
    this.goodsReceiptRepository = goodsReceiptRepository;
    this.vendorBankAccountRepository = vendorBankAccountRepository;
    this.paymentOrderRepository = paymentOrderRepository;
    this.accountRepository = accountRepository;
    this.transactionRepository = transactionRepository;
    this.transactionService = transactionService;
  }

  async list(queryInput: unknown): Promise<PaginatedDto<VendorInvoiceDto>> {
    const query = asRecord(queryInput ?? {}, 'query');
    const parsedQuery: VendorInvoiceListQuery = {
      page: optionalInteger(readField(query, 'page'), 'page'),
      limit: optionalInteger(readField(query, 'limit'), 'limit'),
      search: optionalString(readField(query, 'search')),
      vendorId: optionalString(readField(query, 'vendorId')),
      purchaseOrderId: optionalString(readField(query, 'purchaseOrderId')),
      status: optionalEnum(readField(query, 'status'), vendorInvoiceStatuses, 'status'),
      dateFrom: optionalString(readField(query, 'dateFrom')),
      dateTo: optionalString(readField(query, 'dateTo')),
    };

    const [invoices, vendors, purchaseOrders, goodsReceipts, paymentOrders, accounts, transactions] =
      await Promise.all([
        this.vendorInvoiceRepository.listAll(),
        this.vendorRepository.listAll(),
        this.purchaseOrderRepository.listAll(),
        this.goodsReceiptRepository.listAll(),
        this.paymentOrderRepository.listAll(),
        this.accountRepository.listAll(),
        this.transactionRepository.listAll(),
      ]);

    const vendorsById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
    const purchaseOrdersById = new Map(
      purchaseOrders.map((purchaseOrder) => [purchaseOrder.id, purchaseOrder]),
    );
    const goodsReceiptsById = new Map(
      goodsReceipts.map((goodsReceipt) => [goodsReceipt.id, goodsReceipt]),
    );
    const paymentOrdersById = new Map(
      paymentOrders.map((paymentOrder) => [paymentOrder.id, paymentOrder]),
    );
    const accountsById = new Map(accounts.map((account) => [account.id, account]));
    const transactionsById = new Map(
      transactions.map((transaction) => [transaction.header.id, transaction]),
    );

    const filtered = sortByNewest(invoices, 'createdAt').filter((invoice) => {
      const vendor = vendorsById.get(invoice.vendorId) ?? null;
      const purchaseOrder = purchaseOrdersById.get(invoice.purchaseOrderId) ?? null;
      const goodsReceipt = invoice.goodsReceiptId
        ? (goodsReceiptsById.get(invoice.goodsReceiptId) ?? null)
        : null;

      return (
        includesSearch(
          [
            invoice.vendorInvoiceNo,
            invoice.referenceNo,
            invoice.description,
            vendor?.vendorName ?? '',
            purchaseOrder?.purchaseOrderNo ?? '',
            goodsReceipt?.goodsReceiptNo ?? '',
          ],
          parsedQuery.search,
        ) &&
        (!parsedQuery.vendorId || invoice.vendorId === parsedQuery.vendorId) &&
        (!parsedQuery.purchaseOrderId ||
          invoice.purchaseOrderId === parsedQuery.purchaseOrderId) &&
        (!parsedQuery.status || invoice.status === parsedQuery.status) &&
        isWithinDateRange(
          `${invoice.invoiceDate}T00:00:00.000Z`,
          parsedQuery.dateFrom,
          parsedQuery.dateTo,
        )
      );
    });

    return paginate(
      filtered.map((invoice) =>
        mapVendorInvoiceToDto(
          invoice,
          vendorsById,
          purchaseOrdersById,
          goodsReceiptsById,
          paymentOrdersById,
          accountsById,
          transactionsById,
        ),
      ),
      parsedQuery.page,
      parsedQuery.limit,
    );
  }

  async create(input: unknown): Promise<VendorInvoiceDto> {
    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const invoices = await this.vendorInvoiceRepository.listAll();
    const vendorInvoiceNo = parsedInput.vendorInvoiceNo
      ? parsedInput.vendorInvoiceNo.toUpperCase()
      : nextSequenceCode(
          'INV',
          invoices.map((invoice) => invoice.vendorInvoiceNo),
        );

    const existing = await this.vendorInvoiceRepository.findByInvoiceNo(vendorInvoiceNo);
    if (existing) {
      throw conflict('VENDOR_INVOICE_NO_EXISTS', 'Vendor invoice number already exists', {
        vendorInvoiceNo,
      });
    }

    const { ledgerBookId } = await this.resolveInvoiceContext(parsedInput);
    const timestamp = nowIso();
    const created = await this.vendorInvoiceRepository.save({
      id: createId('vendorinvoice'),
      vendorInvoiceNo,
      vendorId: parsedInput.vendorId,
      purchaseOrderId: parsedInput.purchaseOrderId,
      goodsReceiptId: parsedInput.goodsReceiptId ?? null,
      payFromAccountId: parsedInput.payFromAccountId,
      expenseAccountId: parsedInput.expenseAccountId,
      ledgerBookId,
      amount: parsedInput.amount,
      currencyCode: parsedInput.currency,
      invoiceDate: parsedInput.invoiceDate,
      status: parsedInput.status,
      referenceNo: parsedInput.referenceNo ?? null,
      description: parsedInput.description ?? null,
      linkedPaymentOrderId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      executedAt: null,
    });

    return this.toDto(created.id);
  }

  async update(id: string, input: unknown): Promise<VendorInvoiceDto> {
    const existing = await this.vendorInvoiceRepository.findById(id);
    if (!existing) {
      throw notFound('VENDOR_INVOICE_NOT_FOUND', 'Vendor invoice not found', { id });
    }

    if (existing.status === 'EXECUTED') {
      throw conflict(
        'VENDOR_INVOICE_NOT_EDITABLE',
        'Executed vendor invoices cannot be edited',
        { id, status: existing.status },
      );
    }

    const parsedInput = await this.parseCreateOrUpdateInput(input);
    const vendorInvoiceNo = parsedInput.vendorInvoiceNo
      ? parsedInput.vendorInvoiceNo.toUpperCase()
      : existing.vendorInvoiceNo;
    const codeOwner = await this.vendorInvoiceRepository.findByInvoiceNo(vendorInvoiceNo);
    if (codeOwner && codeOwner.id !== id) {
      throw conflict('VENDOR_INVOICE_NO_EXISTS', 'Vendor invoice number already exists', {
        vendorInvoiceNo,
      });
    }

    const { ledgerBookId } = await this.resolveInvoiceContext(parsedInput);
    await this.vendorInvoiceRepository.save({
      ...existing,
      vendorInvoiceNo,
      vendorId: parsedInput.vendorId,
      purchaseOrderId: parsedInput.purchaseOrderId,
      goodsReceiptId: parsedInput.goodsReceiptId ?? null,
      payFromAccountId: parsedInput.payFromAccountId,
      expenseAccountId: parsedInput.expenseAccountId,
      ledgerBookId,
      amount: parsedInput.amount,
      currencyCode: parsedInput.currency,
      invoiceDate: parsedInput.invoiceDate,
      status: parsedInput.status,
      referenceNo: parsedInput.referenceNo ?? null,
      description: parsedInput.description ?? null,
      updatedAt: nowIso(),
    });

    return this.toDto(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.vendorInvoiceRepository.findById(id);
    if (!existing) {
      throw notFound('VENDOR_INVOICE_NOT_FOUND', 'Vendor invoice not found', { id });
    }

    if (existing.status === 'EXECUTED') {
      throw conflict(
        'VENDOR_INVOICE_NOT_DELETABLE',
        'Executed vendor invoices cannot be deleted',
        { id, status: existing.status },
      );
    }

    await this.vendorInvoiceRepository.delete(id);
  }

  async execute(id: string): Promise<VendorInvoiceDto> {
    const existing = await this.vendorInvoiceRepository.findById(id);
    if (!existing) {
      throw notFound('VENDOR_INVOICE_NOT_FOUND', 'Vendor invoice not found', { id });
    }

    if (existing.status !== 'DRAFT') {
      throw conflict(
        'VENDOR_INVOICE_NOT_EXECUTABLE',
        'Only draft vendor invoices can be executed',
        { id, status: existing.status },
      );
    }

    const { vendor, purchaseOrder, vendorBankAccount } =
      await this.resolveStoredInvoiceContext(existing);
    const payments = await this.paymentOrderRepository.listAll();
    const paymentOrderNo = nextSequenceCode(
      'PMT',
      payments.map((payment) => payment.paymentOrderNo),
    );
    const timestamp = nowIso();
    const paymentOrder = await this.paymentOrderRepository.save({
      id: createId('payment'),
      paymentOrderNo,
      payeeType: 'VENDOR',
      vendorId: existing.vendorId,
      vendorBankAccountId: vendorBankAccount.id,
      employeeId: null,
      payFromAccountId: existing.payFromAccountId,
      expenseAccountId: existing.expenseAccountId,
      ledgerBookId: existing.ledgerBookId,
      amount: existing.amount,
      currencyCode: existing.currencyCode,
      purpose: `Vendor invoice settlement / ${purchaseOrder.purchaseOrderNo}`,
      paymentDate: existing.invoiceDate,
      status: 'DRAFT',
      referenceNo: existing.referenceNo ?? existing.vendorInvoiceNo,
      description:
        existing.description ??
        `Vendor invoice settlement for ${vendor.vendorName} / ${purchaseOrder.purchaseOrderNo}`,
      sourceType: 'VENDOR_INVOICE',
      sourceId: existing.id,
      linkedTransactionId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      executedAt: null,
    });

    const transaction = await this.transactionService.create({
      type: 'PAYMENT',
      amount: existing.amount,
      debitAccountId: existing.expenseAccountId,
      creditAccountId: existing.payFromAccountId,
      ledgerId: existing.ledgerBookId,
      transactionDate: existing.invoiceDate,
      referenceNo: existing.referenceNo ?? existing.vendorInvoiceNo,
      description:
        existing.description ??
        `Vendor invoice settlement for ${vendor.vendorName} / ${purchaseOrder.purchaseOrderNo}`,
      currency: existing.currencyCode,
      sourceType: 'PAYMENT_ORDER',
      sourceId: paymentOrder.id,
    });

    const postedTransaction = await this.transactionService.post(transaction.id);
    await this.paymentOrderRepository.save({
      ...paymentOrder,
      status: 'EXECUTED',
      linkedTransactionId: postedTransaction.id,
      executedAt: nowIso(),
      updatedAt: nowIso(),
    });
    await this.vendorInvoiceRepository.save({
      ...existing,
      status: 'EXECUTED',
      linkedPaymentOrderId: paymentOrder.id,
      executedAt: nowIso(),
      updatedAt: nowIso(),
    });

    return this.toDto(id);
  }

  private async parseCreateOrUpdateInput(
    input: unknown,
  ): Promise<CreateVendorInvoiceInput | UpdateVendorInvoiceInput> {
    const payload = asRecord(input);
    const parsedInput: CreateVendorInvoiceInput = {
      vendorInvoiceNo: optionalString(readField(payload, 'vendorInvoiceNo')),
      vendorId: requiredString(readField(payload, 'vendorId'), 'vendorId'),
      purchaseOrderId: requiredString(readField(payload, 'purchaseOrderId'), 'purchaseOrderId'),
      goodsReceiptId: optionalString(readField(payload, 'goodsReceiptId')),
      payFromAccountId: requiredString(
        readField(payload, 'payFromAccountId'),
        'payFromAccountId',
      ),
      expenseAccountId: requiredString(
        readField(payload, 'expenseAccountId'),
        'expenseAccountId',
      ),
      amount: roundMoney(requiredPositiveNumber(readField(payload, 'amount'), 'amount')),
      currency: requiredCurrencyCode(readField(payload, 'currency'), 'currency'),
      invoiceDate: requiredDate(readField(payload, 'invoiceDate'), 'invoiceDate'),
      status:
        optionalEnum(readField(payload, 'status'), vendorInvoiceStatuses, 'status') ??
        'DRAFT',
      referenceNo: optionalString(readField(payload, 'referenceNo')),
      description: optionalString(readField(payload, 'description')),
    };

    if (parsedInput.status === 'EXECUTED') {
      throw conflict(
        'VENDOR_INVOICE_STATUS_NOT_ALLOWED',
        'Vendor invoices cannot be created or edited directly as EXECUTED',
        { status: parsedInput.status },
      );
    }

    return parsedInput;
  }

  private async resolveInvoiceContext(
    input: CreateVendorInvoiceInput | UpdateVendorInvoiceInput,
  ) {
    const [vendor, purchaseOrder, goodsReceipt, payFromAccount, expenseAccount] =
      await Promise.all([
        this.vendorRepository.findById(input.vendorId),
        this.purchaseOrderRepository.findById(input.purchaseOrderId),
        input.goodsReceiptId
          ? this.goodsReceiptRepository.findById(input.goodsReceiptId)
          : Promise.resolve(null),
        this.accountRepository.findById(input.payFromAccountId),
        this.accountRepository.findById(input.expenseAccountId),
      ]);

    if (!vendor) {
      throw notFound('VENDOR_NOT_FOUND', 'Vendor not found', { vendorId: input.vendorId });
    }

    if (!purchaseOrder) {
      throw notFound('PURCHASE_ORDER_NOT_FOUND', 'Purchase order not found', {
        purchaseOrderId: input.purchaseOrderId,
      });
    }

    if (purchaseOrder.vendorId !== input.vendorId) {
      throw conflict(
        'VENDOR_INVOICE_VENDOR_MISMATCH',
        'Selected purchase order does not belong to the vendor',
        {
          vendorId: input.vendorId,
          purchaseOrderVendorId: purchaseOrder.vendorId,
          purchaseOrderId: input.purchaseOrderId,
        },
      );
    }

    if (goodsReceipt && goodsReceipt.purchaseOrderId !== input.purchaseOrderId) {
      throw conflict(
        'VENDOR_INVOICE_GOODS_RECEIPT_MISMATCH',
        'Selected goods receipt does not belong to the purchase order',
        {
          goodsReceiptId: goodsReceipt.id,
          purchaseOrderId: input.purchaseOrderId,
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
        'VENDOR_INVOICE_PAY_FROM_ACCOUNT_INVALID',
        'Pay-from account must be an asset-type account',
        {
          accountId: input.payFromAccountId,
          accountCategory: payFromAccount.accountCategory,
        },
      );
    }

    if (expenseAccount.accountCategory !== 'EXPENSE') {
      throw badRequest(
        'VENDOR_INVOICE_EXPENSE_ACCOUNT_INVALID',
        'Expense account must be an expense-type account',
        {
          accountId: input.expenseAccountId,
          accountCategory: expenseAccount.accountCategory,
        },
      );
    }

    if (input.payFromAccountId === input.expenseAccountId) {
      throw conflict(
        'VENDOR_INVOICE_ACCOUNTS_DUPLICATED',
        'Pay-from account and expense account must be different',
        {
          payFromAccountId: input.payFromAccountId,
          expenseAccountId: input.expenseAccountId,
        },
      );
    }

    if (payFromAccount.ledgerBookId !== expenseAccount.ledgerBookId) {
      throw conflict(
        'VENDOR_INVOICE_LEDGER_MISMATCH',
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
      input.currency !== purchaseOrder.currencyCode
    ) {
      throw conflict(
        'VENDOR_INVOICE_CURRENCY_MISMATCH',
        'Vendor invoice currency must match the purchase order and both finance accounts',
        {
          currency: input.currency,
          purchaseOrderCurrency: purchaseOrder.currencyCode,
          payFromAccountCurrency: payFromAccount.currencyCode,
          expenseAccountCurrency: expenseAccount.currencyCode,
        },
      );
    }

    return {
      vendor,
      purchaseOrder,
      goodsReceipt,
      payFromAccount,
      expenseAccount,
      ledgerBookId: payFromAccount.ledgerBookId,
    };
  }

  private async resolveStoredInvoiceContext(existing: {
    id: string;
    vendorId: string;
    purchaseOrderId: string;
    goodsReceiptId: string | null;
    payFromAccountId: string;
    expenseAccountId: string;
    currencyCode: string;
  }) {
    const { vendor, purchaseOrder } = await this.resolveInvoiceContext({
      vendorInvoiceNo: null,
      vendorId: existing.vendorId,
      purchaseOrderId: existing.purchaseOrderId,
      goodsReceiptId: existing.goodsReceiptId,
      payFromAccountId: existing.payFromAccountId,
      expenseAccountId: existing.expenseAccountId,
      amount: 1,
      currency: existing.currencyCode,
      invoiceDate: '2026-01-01',
      status: 'DRAFT',
      referenceNo: null,
      description: null,
    });

    const vendorBankAccounts = await this.vendorBankAccountRepository.listAll();
    const vendorBankAccount =
      vendorBankAccounts.find(
        (item) =>
          item.vendorId === existing.vendorId &&
          item.status === 'active' &&
          item.currencyCode === existing.currencyCode &&
          item.isDefault,
      ) ??
      vendorBankAccounts.find(
        (item) =>
          item.vendorId === existing.vendorId &&
          item.status === 'active' &&
          item.currencyCode === existing.currencyCode,
      ) ??
      null;

    if (!vendorBankAccount) {
      throw notFound(
        'VENDOR_BANK_ACCOUNT_NOT_FOUND',
        'No active vendor bank account is available for vendor invoice payment',
        { vendorId: existing.vendorId, currency: existing.currencyCode },
      );
    }

    return {
      vendor,
      purchaseOrder,
      vendorBankAccount,
    };
  }

  private async toDto(id: string): Promise<VendorInvoiceDto> {
    const invoice = await this.vendorInvoiceRepository.findById(id);
    if (!invoice) {
      throw notFound('VENDOR_INVOICE_NOT_FOUND', 'Vendor invoice not found', { id });
    }

    const [vendors, purchaseOrders, goodsReceipts, paymentOrders, accounts, transactions] =
      await Promise.all([
        this.vendorRepository.listAll(),
        this.purchaseOrderRepository.listAll(),
        this.goodsReceiptRepository.listAll(),
        this.paymentOrderRepository.listAll(),
        this.accountRepository.listAll(),
        this.transactionRepository.listAll(),
      ]);

    return mapVendorInvoiceToDto(
      invoice,
      new Map(vendors.map((vendor) => [vendor.id, vendor])),
      new Map(purchaseOrders.map((purchaseOrder) => [purchaseOrder.id, purchaseOrder])),
      new Map(goodsReceipts.map((goodsReceipt) => [goodsReceipt.id, goodsReceipt])),
      new Map(paymentOrders.map((paymentOrder) => [paymentOrder.id, paymentOrder])),
      new Map(accounts.map((account) => [account.id, account])),
      new Map(transactions.map((transaction) => [transaction.header.id, transaction])),
    );
  }
}
