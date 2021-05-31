export enum Errors {
  // Invalid payload errors (400)
  InvalidPayload = 400000,
  UnconfirmedUser = 400001,
  InvalidRole = 400002,
  InvalidStatus = 400003,
  AlreadyAnswer = 400004,
  InvalidEmail = 400005,
  // Authorization errors (401)
  TokenExpired = 401001,
  TokenInvalid = 401002,
  SessionNotFound = 401003,
  // Forbidden (403)
  Forbidden = 403000,
  // Not found (404)
  NotFound = 404000,
}
