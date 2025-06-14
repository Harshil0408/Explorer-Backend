class APiResponse {
    constructor(statusCode, data = null, message = "Success", success = true) {
        this.statusCode = statusCode < 400;
        this.data = data;
        this.message = message;
        this.success = success;

        // Capture the stack trace if available
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = new Error().stack;
        }
    }
}

export { APiResponse };