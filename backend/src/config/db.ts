import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const ssl = process.env.DB_SSL === "true"
  ? { rejectUnauthorized: false }
  : false;

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl,
});