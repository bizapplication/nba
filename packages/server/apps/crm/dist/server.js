"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const data_source_1 = require("./infrastructure/persistence/typeorm/data-source");
const env_1 = require("./shared/config/env");
async function bootstrap() {
    await data_source_1.AppDataSource.initialize();
    const app = (0, app_1.createApp)(data_source_1.AppDataSource);
    app.listen(env_1.env.port, env_1.env.host, () => {
        console.log(`CRM service listening on http://${env_1.env.host}:${env_1.env.port}`);
    });
}
bootstrap().catch((error) => {
    console.error('Failed to start CRM service:', error);
    process.exit(1);
});
