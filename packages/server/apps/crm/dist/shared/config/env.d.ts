export declare const env: {
    nodeEnv: "development" | "test" | "production";
    host: string;
    port: number;
    db: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
        ssl: boolean;
        synchronize: boolean;
        logging: boolean;
    };
};
