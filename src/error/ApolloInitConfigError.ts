export class ApolloInitConfigError extends Error {
    constructor(message?: string) {
        super(message);
        this.message = `ApolloInitConfigError: ${message}`;
    }
    toString() {
        return this.message;
    }
}
