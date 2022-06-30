/**
 * @description
 * @author tunan
 * @export
 * @class RequestMethodError
 * @extends {Error}
 */
export class RequestMethodError extends Error {
  /**
   * Creates an instance of RequestMethodError.
   * @author tunan
   * @memberof RequestMethodError
   */
  constructor(message?: string) {
    super(message);

    this.message = `RequestMethodError: ${message || this.message}`;
  }
  toString() {
    return this.message;
  }
}
