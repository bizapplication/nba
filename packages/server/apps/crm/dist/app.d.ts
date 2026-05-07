import { type Express } from 'express';
import type { DataSource } from 'typeorm';
export declare function createApp(dataSource: DataSource): Express;
