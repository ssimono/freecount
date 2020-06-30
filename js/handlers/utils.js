export function pretty (amount, showSign = false, locale = 'en-US') {
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' })
  let formatted = formatter.format(amount)

  if (showSign && amount > 0) {
    formatted = `+${formatted}`
  }

  return formatted
}

export const localPretty = (amount, showSign) => pretty(amount, showSign, navigator.language)
