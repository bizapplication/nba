import { DataSource, In } from 'typeorm';

import type { TransactionRepository } from '../../../domain/fin/repositories.ts';
import type { TransactionRecord } from '../../../domain/fin/types.ts';
import {
  transactionHeaderEntity,
  transactionLineEntity,
} from './entities.ts';

export class TypeOrmTransactionRepository implements TransactionRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<TransactionRecord[]> {
    const headerRepository = this.dataSource.getRepository(transactionHeaderEntity);
    const lineRepository = this.dataSource.getRepository(transactionLineEntity);
    const headers = await headerRepository.find();

    if (headers.length === 0) {
      return [];
    }

    const lines = await lineRepository.find({
      where: {
        transactionId: In(headers.map((header) => header.id)),
      },
      order: {
        lineNo: 'ASC',
      },
    });

    return this.combineTransactions(headers, lines);
  }

  async findById(id: string): Promise<TransactionRecord | null> {
    const headerRepository = this.dataSource.getRepository(transactionHeaderEntity);
    const lineRepository = this.dataSource.getRepository(transactionLineEntity);
    const header = await headerRepository.findOneBy({ id });

    if (!header) {
      return null;
    }

    const lines = await lineRepository.find({
      where: { transactionId: id },
      order: { lineNo: 'ASC' },
    });

    return {
      header,
      lines,
    };
  }

  async findByCode(code: string): Promise<TransactionRecord | null> {
    const headerRepository = this.dataSource.getRepository(transactionHeaderEntity);
    const header = await headerRepository
      .createQueryBuilder('transaction')
      .where('UPPER(transaction.code) = UPPER(:code)', { code })
      .getOne();

    if (!header) {
      return null;
    }

    return this.findById(header.id);
  }

  async save(transaction: TransactionRecord): Promise<TransactionRecord> {
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(transactionHeaderEntity).save(transaction.header);
      await manager.getRepository(transactionLineEntity).delete({
        transactionId: transaction.header.id,
      });

      if (transaction.lines.length > 0) {
        await manager.getRepository(transactionLineEntity).save(transaction.lines);
      }
    });

    const saved = await this.findById(transaction.header.id);
    if (!saved) {
      throw new Error(`Transaction ${transaction.header.id} was not found after save.`);
    }

    return saved;
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(transactionLineEntity).delete({ transactionId: id });
      await manager.getRepository(transactionHeaderEntity).delete({ id });
    });
  }

  private combineTransactions(
    headers: TransactionRecord['header'][],
    lines: TransactionRecord['lines'][number][],
  ): TransactionRecord[] {
    const linesByTransactionId = new Map<string, TransactionRecord['lines']>();

    for (const line of lines) {
      const bucket = linesByTransactionId.get(line.transactionId) ?? [];
      bucket.push(line);
      linesByTransactionId.set(line.transactionId, bucket);
    }

    return headers.map((header) => ({
      header,
      lines: linesByTransactionId.get(header.id) ?? [],
    }));
  }
}
