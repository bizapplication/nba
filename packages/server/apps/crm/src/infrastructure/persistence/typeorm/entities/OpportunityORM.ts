import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CustomerORM } from './CustomerORM';

@Entity({ name: 'opportunities' })
export class OpportunityORM {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  customerId!: string;

  @Column({ type: 'varchar', length: 160 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 30, default: 'new' })
  stage!: 'new' | 'qualified' | 'proposal' | 'won' | 'lost';

  @Column({ type: 'timestamptz', nullable: true })
  expectedCloseDate!: Date | null;

  @Column({ type: 'boolean', default: false })
  isdelete!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => CustomerORM, (customer) => customer.opportunities, { nullable: false })
  @JoinColumn({ name: 'customerId' })
  customer?: CustomerORM;
}
