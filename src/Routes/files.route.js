import express from "express";
import {
    clearUp,
    customDelete,
    saveFile,
} from "../controllers/files.controller.js";

const filesRoute = express.Router();

filesRoute.post("/share", saveFile);

filesRoute.post("/clearup", clearUp);

filesRoute.post("/stop-sharing", customDelete);

export default filesRoute;
