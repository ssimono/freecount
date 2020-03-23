export function pretty (amount, showSign = false) {
  const cents = Math.round(amount * 100).toString().substr(-2)
  const units = Math.trunc(amount).toString()
  const sign = (showSign && amount > 0) ? '+' : ''
  return `€${sign}${units}.${cents}`
}
