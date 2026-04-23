import type { FinancialAccount, TransactionRecord } from '../../domain/fin/types.ts';
import type {
  GoodsReceipt,
  PaymentOrder,
  Product,
  PurchaseOrder,
  Vendor,
  VendorBankAccount,
  VendorInvoice,
} from '../../domain/procurement/types.ts';
import type {
  GoodsReceiptDto,
  PaymentDto,
  ProductDto,
  PurchaseOrderDto,
  VendorBankAccountDto,
  VendorDto,
  VendorInvoiceDto,
} from './dto.ts';
import { roundMoney } from '../../shared/money.ts';

export function mapProductToDto(product: Product): ProductDto {
  return {
    id: product.id,
    productCode: product.productCode,
    productName: product.productName,
    unit: product.unit,
    status: product.status,
    description: product.description ?? '',
    createTime: product.createdAt,
  };
}

export function mapVendorToDto(
  vendor: Vendor,
  bankAccountsByVendorId: Map<string, VendorBankAccount[]>,
): VendorDto {
  const bankAccounts = bankAccountsByVendorId.get(vendor.id) ?? [];
  const defaultBankAccount = bankAccounts.find((item) => item.isDefault) ?? null;

  return {
    id: vendor.id,
    vendorCode: vendor.vendorCode,
    vendorName: vendor.vendorName,
    shortName: vendor.shortName,
    status: vendor.status,
    defaultCurrency: vendor.defaultCurrency,
    description: vendor.description ?? '',
    defaultBankAccountId: defaultBankAccount?.id ?? null,
    defaultBankAccountName: defaultBankAccount
      ? `${defaultBankAccount.bankName} / ${defaultBankAccount.accountNo}`
      : null,
    bankAccountCount: bankAccounts.length,
    createTime: vendor.createdAt,
  };
}

export function mapVendorBankAccountToDto(
  bankAccount: VendorBankAccount,
  vendorsById: Map<string, Vendor>,
): VendorBankAccountDto {
  return {
    id: bankAccount.id,
    vendorId: bankAccount.vendorId,
    vendorName: vendorsById.get(bankAccount.vendorId)?.vendorName ?? null,
    bankName: bankAccount.bankName,
    accountName: bankAccount.accountName,
    accountNo: bankAccount.accountNo,
    currency: bankAccount.currencyCode,
    isDefault: bankAccount.isDefault,
    status: bankAccount.status,
    createTime: bankAccount.createdAt,
  };
}

export function mapPurchaseOrderToDto(
  purchaseOrder: PurchaseOrder,
  vendorsById: Map<string, Vendor>,
  productsById: Map<string, Product>,
  goodsReceiptsByPurchaseOrderId: Map<string, GoodsReceipt[]>,
  invoicesByPurchaseOrderId: Map<string, VendorInvoice[]>,
): PurchaseOrderDto {
  const product = productsById.get(purchaseOrder.productId) ?? null;

  return {
    id: purchaseOrder.id,
    purchaseOrderNo: purchaseOrder.purchaseOrderNo,
    vendorId: purchaseOrder.vendorId,
    vendorName: vendorsById.get(purchaseOrder.vendorId)?.vendorName ?? null,
    productId: purchaseOrder.productId,
    productCode: product?.productCode ?? null,
    productName: product?.productName ?? null,
    quantity: roundMoney(purchaseOrder.quantity),
    unitPrice: roundMoney(purchaseOrder.unitPrice),
    amount: roundMoney(purchaseOrder.amount),
    currency: purchaseOrder.currencyCode,
    orderDate: purchaseOrder.orderDate,
    status: purchaseOrder.status,
    referenceNo: purchaseOrder.referenceNo ?? '',
    description: purchaseOrder.description ?? '',
    goodsReceiptCount: goodsReceiptsByPurchaseOrderId.get(purchaseOrder.id)?.length ?? 0,
    invoiceCount: invoicesByPurchaseOrderId.get(purchaseOrder.id)?.length ?? 0,
    createTime: purchaseOrder.createdAt,
  };
}

export function mapGoodsReceiptToDto(
  goodsReceipt: GoodsReceipt,
  purchaseOrdersById: Map<string, PurchaseOrder>,
  vendorsById: Map<string, Vendor>,
  productsById: Map<string, Product>,
): GoodsReceiptDto {
  const product = productsById.get(goodsReceipt.productId) ?? null;

  return {
    id: goodsReceipt.id,
    goodsReceiptNo: goodsReceipt.goodsReceiptNo,
    purchaseOrderId: goodsReceipt.purchaseOrderId,
    purchaseOrderNo: purchaseOrdersById.get(goodsReceipt.purchaseOrderId)?.purchaseOrderNo ?? null,
    vendorId: goodsReceipt.vendorId,
    vendorName: vendorsById.get(goodsReceipt.vendorId)?.vendorName ?? null,
    productId: goodsReceipt.productId,
    productCode: product?.productCode ?? null,
    productName: product?.productName ?? null,
    quantity: roundMoney(goodsReceipt.quantity),
    receiptDate: goodsReceipt.receiptDate,
    status: goodsReceipt.status,
    referenceNo: goodsReceipt.referenceNo ?? '',
    description: goodsReceipt.description ?? '',
    createTime: goodsReceipt.createdAt,
  };
}

export function mapVendorInvoiceToDto(
  vendorInvoice: VendorInvoice,
  vendorsById: Map<string, Vendor>,
  purchaseOrdersById: Map<string, PurchaseOrder>,
  goodsReceiptsById: Map<string, GoodsReceipt>,
  paymentOrdersById: Map<string, PaymentOrder>,
  accountsById: Map<string, FinancialAccount>,
  transactionsById: Map<string, TransactionRecord>,
): VendorInvoiceDto {
  const linkedPaymentOrder = vendorInvoice.linkedPaymentOrderId
    ? (paymentOrdersById.get(vendorInvoice.linkedPaymentOrderId) ?? null)
    : null;
  const linkedTransaction = linkedPaymentOrder?.linkedTransactionId
    ? (transactionsById.get(linkedPaymentOrder.linkedTransactionId) ?? null)
    : null;

  return {
    id: vendorInvoice.id,
    vendorInvoiceNo: vendorInvoice.vendorInvoiceNo,
    vendorId: vendorInvoice.vendorId,
    vendorName: vendorsById.get(vendorInvoice.vendorId)?.vendorName ?? null,
    purchaseOrderId: vendorInvoice.purchaseOrderId,
    purchaseOrderNo: purchaseOrdersById.get(vendorInvoice.purchaseOrderId)?.purchaseOrderNo ?? null,
    goodsReceiptId: vendorInvoice.goodsReceiptId,
    goodsReceiptNo: vendorInvoice.goodsReceiptId
      ? (goodsReceiptsById.get(vendorInvoice.goodsReceiptId)?.goodsReceiptNo ?? null)
      : null,
    payFromAccountId: vendorInvoice.payFromAccountId,
    payFromAccountName:
      accountsById.get(vendorInvoice.payFromAccountId)?.accountName ?? null,
    expenseAccountId: vendorInvoice.expenseAccountId,
    expenseAccountName:
      accountsById.get(vendorInvoice.expenseAccountId)?.accountName ?? null,
    amount: roundMoney(vendorInvoice.amount),
    currency: vendorInvoice.currencyCode,
    invoiceDate: vendorInvoice.invoiceDate,
    status: vendorInvoice.status,
    referenceNo: vendorInvoice.referenceNo ?? '',
    description: vendorInvoice.description ?? '',
    paymentOrderId: linkedPaymentOrder?.id ?? null,
    paymentOrderNo: linkedPaymentOrder?.paymentOrderNo ?? null,
    paymentStatus: linkedPaymentOrder?.status ?? null,
    transactionId: linkedTransaction?.header.id ?? null,
    transactionCode: linkedTransaction?.header.code ?? null,
    transactionStatus: linkedTransaction?.header.status ?? null,
    createTime: vendorInvoice.createdAt,
    executedAt: vendorInvoice.executedAt,
  };
}

export function mapPaymentToDto(
  paymentOrder: PaymentOrder,
  vendorsById: Map<string, Vendor>,
  bankAccountsById: Map<string, VendorBankAccount>,
  accountsById: Map<string, FinancialAccount>,
  transactionsById: Map<string, TransactionRecord>,
): PaymentDto {
  const vendorBankAccount = paymentOrder.vendorBankAccountId
    ? (bankAccountsById.get(paymentOrder.vendorBankAccountId) ?? null)
    : null;
  const linkedTransaction = paymentOrder.linkedTransactionId
    ? transactionsById.get(paymentOrder.linkedTransactionId) ?? null
    : null;
  const vendor = paymentOrder.vendorId
    ? (vendorsById.get(paymentOrder.vendorId) ?? null)
    : null;

  return {
    id: paymentOrder.id,
    paymentOrderNo: paymentOrder.paymentOrderNo,
    vendorId: paymentOrder.vendorId,
    vendorName: vendor?.vendorName ?? null,
    vendorBankAccountId: paymentOrder.vendorBankAccountId,
    vendorBankAccountName: vendorBankAccount
      ? `${vendorBankAccount.bankName} / ${vendorBankAccount.accountNo}`
      : null,
    payFromAccountId: paymentOrder.payFromAccountId,
    payFromAccountName:
      accountsById.get(paymentOrder.payFromAccountId)?.accountName ?? null,
    expenseAccountId: paymentOrder.expenseAccountId,
    expenseAccountName:
      accountsById.get(paymentOrder.expenseAccountId)?.accountName ?? null,
    amount: roundMoney(paymentOrder.amount),
    currency: paymentOrder.currencyCode,
    purpose: paymentOrder.purpose,
    paymentDate: paymentOrder.paymentDate,
    status: paymentOrder.status,
    referenceNo: paymentOrder.referenceNo ?? '',
    description: paymentOrder.description ?? '',
    transactionId: linkedTransaction?.header.id ?? null,
    transactionCode: linkedTransaction?.header.code ?? null,
    transactionStatus: linkedTransaction?.header.status ?? null,
    createTime: paymentOrder.createdAt,
    executedAt: paymentOrder.executedAt,
  };
}
