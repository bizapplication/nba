import { DataSource } from 'typeorm';

import type { ExpenseClaimRepository } from '../../../domain/hr/repositories.ts';
import type { ExpenseClaim } from '../../../domain/hr/types.ts';
import { expenseClaimEntity } from './entities.ts';

export class TypeOrmExpenseClaimRepository implements ExpenseClaimRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<ExpenseClaim[]> {
    return this.dataSource.getRepository(expenseClaimEntity).find();
  }

  async findById(id: string): Promise<ExpenseClaim | null> {
    return this.dataSource.getRepository(expenseClaimEntity).findOneBy({ id });
  }

  async findByClaimNo(expenseClaimNo: string): Promise<ExpenseClaim | null> {
    return this.dataSource
      .getRepository(expenseClaimEntity)
      .createQueryBuilder('expenseClaim')
      .where('UPPER(expenseClaim.expenseClaimNo) = UPPER(:expenseClaimNo)', {
        expenseClaimNo,
      })
      .getOne();
  }

  async save(expenseClaim: ExpenseClaim): Promise<ExpenseClaim> {
    return this.dataSource.getRepository(expenseClaimEntity).save(expenseClaim);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(expenseClaimEntity).delete({ id });
  }
}
