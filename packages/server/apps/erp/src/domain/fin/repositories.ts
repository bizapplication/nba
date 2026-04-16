import type {
  FinancialAccount,
  FinancialInstitution,
  LedgerBook,
  TransactionRecord,
} from './types.ts';

export interface BankRepository {
  listAll(): Promise<FinancialInstitution[]>;
  findById(id: string): Promise<FinancialInstitution | null>;
  findByExternalBankCode(bankCode: string): Promise<FinancialInstitution | null>;
  save(bank: FinancialInstitution): Promise<FinancialInstitution>;
  delete(id: string): Promise<void>;
}

export interface LedgerRepository {
  listAll(): Promise<LedgerBook[]>;
  findById(id: string): Promise<LedgerBook | null>;
  findByCode(code: string): Promise<LedgerBook | null>;
  save(ledger: LedgerBook): Promise<LedgerBook>;
  delete(id: string): Promise<void>;
}

export interface AccountRepository {
  listAll(): Promise<FinancialAccount[]>;
  findById(id: string): Promise<FinancialAccount | null>;
  findByCode(code: string): Promise<FinancialAccount | null>;
  save(account: FinancialAccount): Promise<FinancialAccount>;
  delete(id: string): Promise<void>;
}

export interface TransactionRepository {
  listAll(): Promise<TransactionRecord[]>;
  findById(id: string): Promise<TransactionRecord | null>;
  findByCode(code: string): Promise<TransactionRecord | null>;
  save(transaction: TransactionRecord): Promise<TransactionRecord>;
  delete(id: string): Promise<void>;
}
