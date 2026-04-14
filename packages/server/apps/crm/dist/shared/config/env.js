"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
function toBoolean(input, fallback) {
    if (input === undefined)
        return fallback;
    const value = input.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(value))
        return true;
    if (['0', 'false', 'no', 'n', 'off'].includes(value))
        return false;
    return fallback;
}
const EnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    CRM_HOST: zod_1.z.string().default('0.0.0.0'),
    CRM_PORT: zod_1.z.coerce.number().int().positive().default(3002),
    CRM_DB_HOST: zod_1.z.string().default('127.0.0.1'),
    CRM_DB_PORT: zod_1.z.coerce.number().int().positive().default(5432),
    CRM_DB_USER: zod_1.z.string().default('nba'),
    CRM_DB_PASSWORD: zod_1.z.string().default('nba'),
    CRM_DB_NAME: zod_1.z.string().default('crm_db'),
    CRM_DB_SSL: zod_1.z.string().optional(),
    CRM_DB_SYNC: zod_1.z.string().optional(),
    CRM_DB_LOGGING: zod_1.z.string().optional(),
});
const raw = EnvSchema.parse(process.env);
exports.env = {
    nodeEnv: raw.NODE_ENV,
    host: raw.CRM_HOST,
    port: raw.CRM_PORT,
    db: {
        host: raw.CRM_DB_HOST,
        port: raw.CRM_DB_PORT,
        user: raw.CRM_DB_USER,
        password: raw.CRM_DB_PASSWORD,
        database: raw.CRM_DB_NAME,
        ssl: toBoolean(raw.CRM_DB_SSL, false),
        synchronize: toBoolean(raw.CRM_DB_SYNC, false),
        logging: toBoolean(raw.CRM_DB_LOGGING, false),
    },
};
