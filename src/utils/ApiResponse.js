class APiResponse {
    constructor(statusCode, data = null, message = "Success", success = true) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = success;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = new Error().stack;
        }
    }
}

export { APiResponse };