import crypto from "crypto";
import File from "../models/files.model.js";
import { deleteMedia } from "../utils/supabase.js";
import { appPassword, myEmail } from "../config/env.js";
import nodemailer from "nodemailer";

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
            setTimeout(async () => {
                await deleteMedia(file.URL);
                await file.deleteOne();
            }, 10 * 60 * 1000);
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
    console.log(req.body);
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

export const sendURLViaEmail = async (req, res, next) => {
    const { url, email } = req.body;

    console.log("Email: ", email);
    console.log("URL: ", url);
    console.log("My Email: ", myEmail);
    console.log("App PSW: ", appPassword);

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: myEmail,
            pass: appPassword,
        },
    });

    console.log("Transporter Creation passed", transporter);

    try {
        if (!email) {
            const err = new Error("Email is required");
            err.statusCode = 404;
            throw err;
        }

        const mailOptions = {
            from: "instaShare",
            sender: "instaShare",
            to: email,
            subject: "Your shared file is ready!",
            html: `
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
        };

        console.log("Mail Options created");

        const sent = await transporter.sendMail(mailOptions);

        console.log("Transporter sent mail:", sent);

        res.status(250).json({
            success: true,
            message: "Mail sent successfully",
        });
    } catch (err) {
        console.log(err);

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
