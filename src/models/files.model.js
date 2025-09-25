import mongoose from "mongoose";
import crypto from "crypto";
import { encryptionKey } from "../config/env.js";

const key = Buffer.from(encryptionKey, "utf8").slice(0, 32);
const IV_LENGTH = 16;

// AES encryption
function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
}

// AES decryption
function decrypt(text) {
    const [ivHex, encryptedData] = text.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

const filesSchema = new mongoose.Schema({
    URL: {
        type: String,
        required: true,
        set: encrypt,
        get: decrypt,
    },

    URLHash: {
        type: String,
        required: true,
        unique: true,
    },

    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        validate: {
            validator: (v) => v > new Date(),
            message: "expiresAt must be a future date",
        },
    },

    instantDelete: { type: Boolean, default: false },
});

filesSchema.set("toJSON", { getters: true });
filesSchema.set("toObject", { getters: true });

const File = mongoose.model("File", filesSchema);
export default File;
