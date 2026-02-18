const symbols = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CHF: "CHF",
  CNY: "¥",
  RUB: "₽",
} as const

export function getCurrencySymbol(code: keyof typeof symbols) {
  return symbols[code] ?? ""
}