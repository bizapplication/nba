import type {
  FinancialAccount,
  TransactionLine,
} from '../../domain/fin/types.ts';
import type { TransactionRepository } from '../../domain/fin/repositories.ts';
import { roundMoney } from '../../shared/money.ts';

interface AccountSums {
  debits: number;
  credits: number;
}

export class AccountBalanceService {
  transactionRepository: TransactionRepository;

  constructor(transactionRepository: TransactionRepository) {
    this.transactionRepository = transactionRepository;
  }

  async computeBalanceMap(
    accounts: FinancialAccount[],
  ): Promise<Map<string, number>> {
    const sumsByAccountId = new Map<string, AccountSums>();
    const transactions = await this.transactionRepository.listAll();

    for (const transaction of transactions) {
      if (transaction.header.status !== 'POSTED') {
        continue;
      }

      for (const line of transaction.lines) {
        const existing = sumsByAccountId.get(line.accountId) ?? {
          debits: 0,
          credits: 0,
        };

        if (line.entryType === 'DEBIT') {
          existing.debits = roundMoney(existing.debits + line.amount);
        } else {
          existing.credits = roundMoney(existing.credits + line.amount);
        }

        sumsByAccountId.set(line.accountId, existing);
      }
    }

    const balances = new Map<string, number>();
    for (const account of accounts) {
      balances.set(account.id, this.computeBalanceForAccount(account, sumsByAccountId));
    }

    return balances;
  }

  computeBalanceForLines(
    account: FinancialAccount,
    lines: TransactionLine[],
  ): number {
    let debits = 0;
    let credits = 0;

    for (const line of lines) {
      if (line.accountId !== account.id) {
        continue;
      }

      if (line.entryType === 'DEBIT') {
        debits = roundMoney(debits + line.amount);
      } else {
        credits = roundMoney(credits + line.amount);
      }
    }

    return account.normalBalance === 'DEBIT'
      ? roundMoney(debits - credits)
      : roundMoney(credits - debits);
  }

  private computeBalanceForAccount(
    account: FinancialAccount,
    sumsByAccountId: Map<string, AccountSums>,
  ): number {
    const sums = sumsByAccountId.get(account.id) ?? {
      debits: 0,
      credits: 0,
    };

    return account.normalBalance === 'DEBIT'
      ? roundMoney(sums.debits - sums.credits)
      : roundMoney(sums.credits - sums.debits);
  }
}
