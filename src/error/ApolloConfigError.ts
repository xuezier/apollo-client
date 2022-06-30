export class ApolloConfigError extends Error {
    constructor(message?: string) {
        super(message);
        this.message = `ApolloConfigError: ${message}`;
    }
    toString() {
        return this.message;
    }
}
