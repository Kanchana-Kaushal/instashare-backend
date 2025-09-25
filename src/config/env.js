import "dotenv/config";

export const PORT = process.env.PORT || 3000;

export const connString =
    process.env.MDB_CONN_STRING || "mongodb://localhost:27017/instaNote";

export const encryptionKey = process.env.ENCRYPTION_KEY;

export const supabaseURL = process.env.SUPABASE_URL;

export const supabaseKEY = process.env.SUPABASE_KEY;

export const myEmail = process.env.MY_EMAIL;

export const appPassword = process.env.APP_PASSWORD;
