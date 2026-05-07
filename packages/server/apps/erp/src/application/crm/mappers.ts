import type { FinancialAccount, TransactionRecord } from '../../domain/fin/types.ts';
import type {
  Customer,
  CustomerBankAccount,
  ReceiptOrder,
} from '../../domain/crm/types.ts';
import type {
  CustomerBankAccountDto,
  CustomerDto,
  ReceiptDto,
} from './dto.ts';
import { roundMoney } from '../../shared/money.ts';

export function mapCustomerToDto(
  customer: Customer,
  bankAccountsByCustomerId: Map<string, CustomerBankAccount[]>,
): CustomerDto {
  const bankAccounts = bankAccountsByCustomerId.get(customer.id) ?? [];
  const defaultBankAccount = bankAccounts.find((item) => item.isDefault) ?? null;

  return {
    id: customer.id,
    customerCode: customer.customerCode,
    customerName: customer.customerName,
    shortName: customer.shortName,
    status: customer.status,
    defaultCurrency: customer.defaultCurrency,
    description: customer.description ?? '',
    defaultBankAccountId: defaultBankAccount?.id ?? null,
    defaultBankAccountName: defaultBankAccount
      ? `${defaultBankAccount.bankName} / ${defaultBankAccount.accountNo}`
      : null,
    bankAccountCount: bankAccounts.length,
    createTime: customer.createdAt,
  };
}

export function mapCustomerBankAccountToDto(
  bankAccount: CustomerBankAccount,
  customersById: Map<string, Customer>,
): CustomerBankAccountDto {
  return {
    id: bankAccount.id,
    customerId: bankAccount.customerId,
    customerName: customersById.get(bankAccount.customerId)?.customerName ?? null,
    bankName: bankAccount.bankName,
    accountName: bankAccount.accountName,
    accountNo: bankAccount.accountNo,
    currency: bankAccount.currencyCode,
    isDefault: bankAccount.isDefault,
    status: bankAccount.status,
    createTime: bankAccount.createdAt,
  };
}

export function mapReceiptToDto(
  receiptOrder: ReceiptOrder,
  customersById: Map<string, Customer>,
  bankAccountsById: Map<string, CustomerBankAccount>,
  accountsById: Map<string, FinancialAccount>,
  transactionsById: Map<string, TransactionRecord>,
): ReceiptDto {
  const customerBankAccount = bankAccountsById.get(receiptOrder.customerBankAccountId);
  const linkedTransaction = receiptOrder.linkedTransactionId
    ? transactionsById.get(receiptOrder.linkedTransactionId) ?? null
    : null;

  return {
    id: receiptOrder.id,
    receiptOrderNo: receiptOrder.receiptOrderNo,
    customerId: receiptOrder.customerId,
    customerName: customersById.get(receiptOrder.customerId)?.customerName ?? null,
    customerBankAccountId: receiptOrder.customerBankAccountId,
    customerBankAccountName: customerBankAccount
      ? `${customerBankAccount.bankName} / ${customerBankAccount.accountNo}`
      : null,
    receiptToAccountId: receiptOrder.receiptToAccountId,
    receiptToAccountName:
      accountsById.get(receiptOrder.receiptToAccountId)?.accountName ?? null,
    revenueAccountId: receiptOrder.revenueAccountId,
    revenueAccountName:
      accountsById.get(receiptOrder.revenueAccountId)?.accountName ?? null,
    amount: roundMoney(receiptOrder.amount),
    currency: receiptOrder.currencyCode,
    purpose: receiptOrder.purpose,
    receiptDate: receiptOrder.receiptDate,
    status: receiptOrder.status,
    referenceNo: receiptOrder.referenceNo ?? '',
    description: receiptOrder.description ?? '',
    transactionId: linkedTransaction?.header.id ?? null,
    transactionCode: linkedTransaction?.header.code ?? null,
    transactionStatus: linkedTransaction?.header.status ?? null,
    createTime: receiptOrder.createdAt,
    executedAt: receiptOrder.executedAt,
  };
}
