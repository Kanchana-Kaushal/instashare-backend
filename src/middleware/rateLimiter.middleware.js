import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
});

export const emailLimiter = rateLimit({
    windowMs: 60 * 10 * 1000, // 10 minute
    max: 16, // limit each IP to 16 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
});

export const wakeUpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 1,
    message: "Already Waken Up",
    keyGenerator: () => "global", //This line will make every request globally recognized. not per IP.
});
