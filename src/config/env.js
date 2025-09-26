import "dotenv/config";

export const PORT = process.env.PORT || 3000;

export const connString =
    process.env.MDB_CONN_STRING || "mongodb://localhost:27017/instaNote";

export const encryptionKey = process.env.ENCRYPTION_KEY;

export const supabaseURL = process.env.SUPABASE_URL;

export const supabaseKEY = process.env.SUPABASE_KEY;

export const frontEndUrl = process.env.FRONTEND_URL;

export const mailJetApiKey = process.env.MAILJET_API_KEY;

export const mailJetSecretKey = process.env.MAILJET_SECRET_KEY;

export const myEmail = process.env.MY_EMAIL;
