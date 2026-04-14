import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'customers' })
export class CustomerORM {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 180, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 60 })
  phone!: string;

  @Column({ type: 'varchar', length: 180 })
  company!: string;

  @Column({ type: 'boolean', default: false })
  isdelete!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
