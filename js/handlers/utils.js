export function pretty (amount, showSign = false) {
  const rounded = (Math.round(amount * 100) / 100).toString()
  const sign = (showSign && amount > 0) ? '+' : ''
  return `€${sign}${rounded}`
}
