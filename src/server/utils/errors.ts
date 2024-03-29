export enum Errors {
  // Invalid payload errors (400)
  InvalidPayload = 400000,
  UnconfirmedUser = 400001,
  InvalidRole = 400002,
  InvalidStatus = 400003,
  AlreadyAnswer = 400004,
  KYCAlreadyVerified = 400005,
  KYCRequired = 400006,
  InvalidEmail = 400005,
  InvalidActiveStatusTOTP = 400006,
  InvalidTOTP = 400007,
  UserAlreadyConfirmed = 400008,
  InvalidType = 400009,
  AlreadyExists = 400010,
  InvalidDate = 400011,
  WalletExists = 400012,
  BlockedUser = 400013,
  PhoneNumberAlreadyConfirmed = 400014,
  HasActiveQuests = 400015,
  HasActiveResponses = 400016,
  NoRole = 400017,
  UnknownBucketError = 400018,
  UserLeaveChat = 400019,
  // Authorization errors (401)
  TokenExpired = 401001,
  TokenInvalid = 401002,
  SessionNotFound = 401003,
  // Forbidden (403)
  Forbidden = 403000,
  // Not found (404)
  NotFound = 404000,
  // Conflict (409)
  SumSubError = 409001,
  LiquidityError = 409002,
  // Quiknode Send request error
  QuikNodeError = 409003,
}
