import { registerAs } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { join } from "path";

export default registerAs(
  "database",
  (): TypeOrmModuleOptions => ({
    type: "postgres",
    host: process.env.POSTGRES_HOST ?? "localhost",
    port: parseInt(process.env.POSTGRES_PORT ?? "5432", 10),
    username: process.env.POSTGRES_USER ?? "referrals",
    password: process.env.POSTGRES_PASSWORD ?? "referrals_secret",
    database: process.env.POSTGRES_DB ?? "referrals_db",
    entities: [join(__dirname, "..", "**", "*.entity.{ts,js}")],
    migrations: [join(__dirname, "..", "database", "migrations", "*.{ts,js}")],
    synchronize: false,
    logging: process.env.NODE_ENV === "development",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  }),
);
