import express from "express";
import { clearUp, saveFile } from "../controllers/files.controller.js";

const filesRoute = express.Router();

filesRoute.post("/share", saveFile);

filesRoute.get("/clearup", clearUp);

export default filesRoute;
