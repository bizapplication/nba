import type {
  AccountDto,
  BankDto,
  LedgerDto,
  TransactionDto,
} from './dto.ts';
import type {
  AccountCategory,
  FinancialAccount,
  FinancialInstitution,
  LedgerBook,
  TransactionRecord,
} from '../../domain/fin/types.ts';
import { roundMoney } from '../../shared/money.ts';

function accountCategoryToUiType(category: AccountCategory): AccountDto['type'] {
  if (category === 'REVENUE') {
    return 'INCOME';
  }

  return category;
}

export function accountUiTypeToCategory(value: AccountDto['type']): AccountCategory {
  if (value === 'INCOME') {
    return 'REVENUE';
  }

  return value;
}

export function mapBankToDto(bank: FinancialInstitution): BankDto {
  return {
    id: bank.id,
    name: bank.name,
    bankCode: bank.externalBankCode,
    shortName: bank.shortName,
    description: bank.description ?? '',
    financialStatus: bank.financialStatus,
    status: bank.status,
    updatedAt: bank.updatedAt,
  };
}

export function mapLedgerToDto(
  ledger: LedgerBook,
  banksById: Map<string, FinancialInstitution>,
  ledgersById: Map<string, LedgerBook>,
): LedgerDto {
  return {
    id: ledger.id,
    name: ledger.name,
    code: ledger.code,
    description: ledger.description ?? '',
    type: ledger.bookType,
    bankId: ledger.linkedInstitutionId,
    bankName: ledger.linkedInstitutionId
      ? (banksById.get(ledger.linkedInstitutionId)?.name ?? null)
      : null,
    parentId: ledger.parentBookId,
    parentName: ledger.parentBookId
      ? (ledgersById.get(ledger.parentBookId)?.name ?? null)
      : null,
    baseCurrency: ledger.baseCurrencyCode,
    status: ledger.status,
    createTime: ledger.createdAt,
  };
}

export function mapAccountToDto(
  account: FinancialAccount,
  balance: number,
  ledgersById: Map<string, LedgerBook>,
  accountsById: Map<string, FinancialAccount>,
): AccountDto {
  return {
    id: account.id,
    name: account.accountName,
    code: account.accountCode,
    description: account.description ?? '',
    type: accountCategoryToUiType(account.accountCategory),
    balanceType: account.normalBalance,
    currency: account.currencyCode,
    parentId: account.parentAccountId,
    parentName: account.parentAccountId
      ? (accountsById.get(account.parentAccountId)?.accountName ?? null)
      : null,
    ledgerId: account.ledgerBookId,
    ledgerName: ledgersById.get(account.ledgerBookId)?.name ?? null,
    balance: roundMoney(balance),
    status: account.accountStatus,
    createTime: account.createdAt,
  };
}

export function mapTransactionToDto(
  transaction: TransactionRecord,
  accountsById: Map<string, FinancialAccount>,
  ledgersById: Map<string, LedgerBook>,
): TransactionDto {
  const debitLine = transaction.lines.find((line) => line.entryType === 'DEBIT');
  const creditLine = transaction.lines.find((line) => line.entryType === 'CREDIT');
  const amount = debitLine?.amount ?? creditLine?.amount ?? 0;
  const currency = debitLine?.currencyCode ?? creditLine?.currencyCode ?? '';

  return {
    id: transaction.header.id,
    code: transaction.header.code,
    type: transaction.header.businessType,
    amount: roundMoney(amount),
    currency,
    debitAccountId: debitLine?.accountId ?? '',
    debitAccountName: debitLine
      ? (accountsById.get(debitLine.accountId)?.accountName ?? null)
      : null,
    creditAccountId: creditLine?.accountId ?? '',
    creditAccountName: creditLine
      ? (accountsById.get(creditLine.accountId)?.accountName ?? null)
      : null,
    ledgerId: transaction.header.ledgerBookId,
    ledgerName: ledgersById.get(transaction.header.ledgerBookId)?.name ?? null,
    transactionDate: transaction.header.transactionDate,
    status: transaction.header.status,
    referenceNo: transaction.header.referenceNo ?? '',
    description: transaction.header.description ?? '',
    createTime: transaction.header.createdAt,
  };
}
