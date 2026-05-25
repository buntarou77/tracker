import getEnv from "./getEnv";

export const rateLimits: Record<string, { max: string; window: string }> = {
  login:           { max: getEnv('RATE_LIMIT_LOGIN_MAX'),            window: getEnv('RATE_LIMIT_LOGIN_WINDOW_SEC') },
  register:        { max: getEnv('RATE_LIMIT_REGISTER_MAX'),         window: getEnv('RATE_LIMIT_REGISTER_WINDOW_SEC') },
  resetPassword:   { max: getEnv('RATE_LIMIT_RESET_PASSWORD_MAX'),   window: getEnv('RATE_LIMIT_RESET_PASSWORD_WINDOW_SEC') },
  resetEmail:      { max: getEnv('RATE_LIMIT_RESET_EMAIL_MAX'),      window: getEnv('RATE_LIMIT_RESET_EMAIL_WINDOW_SEC') },
  genResetCode:    { max: getEnv('RATE_LIMIT_GEN_RESET_CODE_MAX'),   window: getEnv('RATE_LIMIT_GEN_RESET_CODE_WINDOW_SEC') },
  auth:            { max: getEnv('RATE_LIMIT_AUTH_MAX'),              window: getEnv('RATE_LIMIT_AUTH_WINDOW_SEC') },
  me:              { max: getEnv('RATE_LIMIT_ME_MAX'),                window: getEnv('RATE_LIMIT_ME_WINDOW_SEC') },
  changeUsername:   { max: getEnv('RATE_LIMIT_CHANGE_USERNAME_MAX'),  window: getEnv('RATE_LIMIT_CHANGE_USERNAME_WINDOW_SEC') },
  addNewAccount:   { max: getEnv('RATE_LIMIT_ADD_NEW_ACCOUNT_MAX'),  window: getEnv('RATE_LIMIT_ADD_NEW_ACCOUNT_WINDOW_SEC') },
  addTrans:        { max: getEnv('RATE_LIMIT_ADD_TRANS_MAX'),        window: getEnv('RATE_LIMIT_ADD_TRANS_WINDOW_SEC') },
  getTrans:        { max: getEnv('RATE_LIMIT_GET_TRANS_MAX'),        window: getEnv('RATE_LIMIT_GET_TRANS_WINDOW_SEC') },
  transactions:    { max: getEnv('RATE_LIMIT_TRANSACTIONS_MAX'),     window: getEnv('RATE_LIMIT_TRANSACTIONS_WINDOW_SEC') },
  addPlan:         { max: getEnv('RATE_LIMIT_ADD_PLAN_MAX'),         window: getEnv('RATE_LIMIT_ADD_PLAN_WINDOW_SEC') },
  rewritePlan:     { max: getEnv('RATE_LIMIT_REWRITE_PLAN_MAX'),     window: getEnv('RATE_LIMIT_REWRITE_PLAN_WINDOW_SEC') },
  getExchangeRate: { max: getEnv('RATE_LIMIT_GET_EXCHANGE_RATE_MAX'),window: getEnv('RATE_LIMIT_GET_EXCHANGE_RATE_WINDOW_SEC') },
}