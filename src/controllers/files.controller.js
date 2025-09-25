import crypto from "crypto";
import File from "../models/files.model.js";
import { deleteMedia } from "../utils/supabase.js";

export const saveFile = async (req, res, next) => {
    try {
        const { url, ttl, instantDelete } = req.body;
        const URL = url.trim();

        if (
            !URL ||
            !ttl ||
            instantDelete === undefined ||
            instantDelete === null
        ) {
            const err = new Error("Required fields missing");
            err.statusCode = 400;
            throw err;
        }

        let expiresAt;

        switch (ttl) {
            case "1h":
                expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
                break;
            case "3h":
                expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours
                break;
            case "6h":
                expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours
                break;
            case "12h":
                expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
                break;
            case "24h":
                expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
                break;
            case "3d":
                expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
                break;
            case "7d":
                expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
                break;
            default:
                expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // fallback 7 days
                break;
        }

        const hashedURL = hashURL(URL);

        const file = new File({
            URL,
            URLHash: hashedURL,
            expiresAt,
            instantDelete: instantDelete,
        });

        await file.save();

        await cleanUpExpired(next);

        res.json({
            success: true,
            message: "Record Saved Successfully",
        });
    } catch (err) {
        next(err);
    }
};

export const clearUp = async (req, res, next) => {
    const urlRaw = req.body.url;
    const URL = urlRaw.trim();

    try {
        if (!URL) {
            const err = new Error("URL is required");
            err.statusCode = 400;
            throw err;
        }

        const hashedURL = hashURL(URL);

        const file = await File.findOne({ URLHash: hashedURL });

        if (!file) {
            const err = new Error("Cannot find the file");
            err.statusCode = 404;
            throw err;
        }

        if (file.instantDelete === true) {
            await deleteMedia(file.URL);
            await file.deleteOne();
        }

        await cleanUpExpired(next);

        res.json({
            success: true,
            message: "Operation Successful",
        });
    } catch (err) {
        next(err);
    }
};

export const customDelete = async (req, res, next) => {
    const urlRaw = req.params.url;
    const URL = urlRaw.trim();

    try {
        if (!URL) {
            const err = new Error("URL is required");
            err.statusCode = 400;
            throw err;
        }

        const hashedURL = hashURL(URL);

        const file = await File.findOne({ URLHash: hashedURL });

        if (!file) {
            const err = new Error("Cannot find the file");
            err.statusCode = 404;
            throw err;
        }

        //Supabase Delete
        await file.deleteOne();

        await cleanUpExpired(next);

        res.json({
            success: true,
            message: "Operation Successful",
        });
    } catch (err) {
        next(err);
    }
};

// Deterministic SHA256 hash for querying/uniqueness
function hashURL(text) {
    return crypto.createHash("sha256").update(text).digest("hex");
}

//This function is use to clean up expired files
const cleanUpExpired = async (next) => {
    try {
        const filesToBeDeleted = await File.find({
            expiresAt: { $lt: new Date() },
        });

        if (filesToBeDeleted.length > 0) {
            await Promise.all(
                filesToBeDeleted.map(async (file) => {
                    await deleteMedia(file.URL);
                    await file.deleteOne();
                })
            );
        }
    } catch (err) {
        next(err);
    }
};
