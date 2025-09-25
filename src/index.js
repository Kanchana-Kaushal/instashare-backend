import express from "express";
import { connString, PORT } from "./config/env.js";
import mongoose from "mongoose";
import filesRoute from "./Routes/files.route.js";
import errorHandler from "./middleware/error.middleware.js";
import morgan from "morgan";
import { deleteMedia } from "./utils/supabase.js";

const app = express();

app.use(morgan("tiny"));
app.use(express.json());

app.use("/api/files", filesRoute);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Resource not found",
    });
});

app.use(errorHandler);

app.listen(PORT, async () => {
    console.log("Server is listening on PORT " + PORT);
    try {
        await mongoose.connect(connString);
        console.log("Database connected successfully");
    } catch (err) {
        console.log(err);
    }
});
