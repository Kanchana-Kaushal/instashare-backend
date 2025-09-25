import express from "express";
import {
    clearUp,
    customDelete,
    saveFile,
    sendURLViaEmail,
} from "../controllers/files.controller.js";
import { emailLimiter } from "../middleware/rateLimiter.middleware.js";

const filesRoute = express.Router();

filesRoute.post("/share", saveFile);

filesRoute.post("/clearup", clearUp);

filesRoute.post("/stop-sharing", customDelete);

filesRoute.post("/send-email", emailLimiter, sendURLViaEmail);

export default filesRoute;
