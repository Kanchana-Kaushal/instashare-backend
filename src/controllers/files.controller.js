import crypto from "crypto";
import File from "../models/files.model.js";
import { deleteMedia, verifyFileExists } from "../utils/supabase.js";
import { mailJetApiKey, mailJetSecretKey, myEmail } from "../config/env.js";
import Mailjet from "node-mailjet";

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

        const ttlMap = {
            "1h": 1 * 60 * 60 * 1000,
            "3h": 3 * 60 * 60 * 1000,
            "6h": 6 * 60 * 60 * 1000,
            "12h": 12 * 60 * 60 * 1000,
            "24h": 24 * 60 * 60 * 1000,
            "3d": 3 * 24 * 60 * 60 * 1000,
            "7d": 7 * 24 * 60 * 60 * 1000,
        };
        const expiresAt = new Date(Date.now() + (ttlMap[ttl] ?? ttlMap["7d"]));

        const hashedURL = hashURL(URL);

        const file = new File({
            URL,
            URLHash: hashedURL,
            expiresAt,
            instantDelete: instantDelete,
        });

        await file.save();

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
    const URL = urlRaw?.trim();

    try {
        if (!URL) {
            const err = new Error("URL is required");
            err.statusCode = 400;
            throw err;
        }

        const hashedURL = hashURL(URL);

        const file = await File.findOne({ URLHash: hashedURL });

        if (file && file.instantDelete === true) {
            await deleteMedia(file.URL);
            await file.deleteOne();
        }

        res.json({
            success: true,
            message: "Cleanup scheduled successfully",
        });
    } catch (err) {
        next(err);
    }
};

export const customDelete = async (req, res, next) => {
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

        await file.deleteOne();
        await deleteMedia(URL);

        res.json({
            success: true,
            message: "Operation Successful",
        });
    } catch (err) {
        next(err);
    }
};

export const sendURLViaEmail = async (req, res, next) => {
    const { url, email } = req.body;

    try {
        if (!email) {
            const err = new Error("Email is required");
            err.statusCode = 404;
            throw err;
        }

        const mailjet = Mailjet.apiConnect(mailJetApiKey, mailJetSecretKey);

        await mailjet.post("send", { version: "v3.1" }).request({
            Messages: [
                {
                    From: {
                        Email: myEmail,
                        Name: "instaShare",
                    },
                    To: [
                        {
                            Email: email,
                        },
                    ],
                    Subject: "Your shared file is ready!",
                    HTMLPart: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; color: #333;">
        <h1 style="font-size: 28px; text-align: center; margin-bottom: 30px;">
          <span style="color: black;">insta</span><span style="color: #38e07b;">Share</span>
        </h1>

        <p style="font-size: 16px; margin-bottom: 20px;">
          Hey there 👋,<br/><br/>
          Someone has shared a file with you through <strong>instaShare</strong>.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" target="_blank" 
            style="background-color: #38e07b; color: white; padding: 12px 24px; 
                   text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            🔗 View Shared File
          </a>
        </div>

        <p style="font-size: 14px; color: #666;">
          This link will expire based on the sender's settings. 
          If you weren’t expecting this email, you can safely ignore it.
        </p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />

        <p style="font-size: 12px; text-align: center; color: #aaa;">
          Powered by <span style="color: black;">insta</span><span style="color: #38e07b;">Share</span>
        </p>
      </div>
    `,
                },
            ],
        });

        res.status(250).json({
            success: true,
            message: "Mail sent successfully",
        });
    } catch (err) {
        console.log(err);
        next(err);
    }
};

export const wakeUp = async (req, res, next) => {
    try {
        const now = new Date();

        const filesToBeDeleted = await File.find({
            expiresAt: { $lt: now },
        });

        if (!filesToBeDeleted.length) return;

        await Promise.all(
            filesToBeDeleted.map(async (file) => {
                try {
                    await deleteMedia(file.URL);
                    await file.deleteOne();
                } catch (err) {
                    console.error(`Failed to delete file ${file._id}:`, err);
                }
            })
        );

        res.send("Active");
    } catch (err) {
        next(err);
    }
};

export const verifyFile = async (req, res, next) => {
    const urlRaw = req.body.url;
    const URL = urlRaw?.trim();

    try {
        if (!URL) {
            const err = new Error("URL is required");
            err.statusCode = 400;
            throw err;
        }

        const hashedURL = hashURL(URL);

        const file = await File.findOne({ URLHash: hashedURL });

        if (!file) {
            const err = new Error("Cannot find the file in DB");
            err.statusCode = 404;
            throw err;
        }

        const supaBaseStatus = await verifyFileExists(URL);

        if (!supaBaseStatus) {
            const err = new Error("Cannot find the file in Supabase");
            err.statusCode = 404;
            throw err;
        }

        res.json({
            success: true,
            message: "File exists",
        });
    } catch (err) {
        next(err);
    }
};

// Deterministic SHA256 hash for querying/uniqueness
function hashURL(text) {
    return crypto.createHash("sha256").update(text).digest("hex");
}
