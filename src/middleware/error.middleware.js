const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Handle Mongoose bad ObjectId
    if (err.name === "CastError") {
        statusCode = 404;
        message = "Resource not found. Invalid ID.";
    }

    // Handle Mongoose duplicate key error
    else if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue).join(", ");
        message = `Duplicate value entered for field(s): ${field}`;
    }

    // Handle Mongoose validation errors
    else if (err.name === "ValidationError") {
        statusCode = 400;
        const errors = Object.values(err.errors).map((val) => val.message);
        message = errors.join(", ");
    }

    // Return response
    res.status(statusCode).json({
        success: false,
        error: message,
    });
};

export default errorHandler;
