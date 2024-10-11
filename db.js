import postgres from "postgres";
import { sql_creds } from "./config.json";

const sql = postgres({
  host: sql_creds.host,
  port: sql_creds.port,
  database: sql_creds.database,
  username: sql_creds.username,
  password: sql_creds.password,
});

export default sql;
