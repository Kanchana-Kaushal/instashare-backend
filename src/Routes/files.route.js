import express from "express";
import {
    clearUp,
    customDelete,
    saveFile,
    sendURLViaEmail,
    verifyFile,
    wakeUp,
} from "../controllers/files.controller.js";
import {
    emailLimiter,
    wakeUpLimiter,
} from "../middleware/rateLimiter.middleware.js";

const filesRoute = express.Router();

filesRoute.get("/wake-up", wakeUpLimiter, wakeUp);

filesRoute.post("/verify-file", verifyFile);

filesRoute.post("/share", saveFile);

filesRoute.post("/clearup", clearUp);

filesRoute.post("/stop-sharing", customDelete);

filesRoute.post("/send-email", emailLimiter, sendURLViaEmail);

export default filesRoute;
