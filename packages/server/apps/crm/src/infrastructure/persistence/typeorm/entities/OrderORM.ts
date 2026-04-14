import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'orders' })
export class OrderORM {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 80, unique: true })
  orderNo!: string;

  @Column({ type: 'varchar', length: 80 })
  customerId!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 30, default: 'draft' })
  status!: 'draft' | 'confirmed' | 'completed' | 'cancelled';

  @Column({ type: 'boolean', default: false })
  isdelete!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
