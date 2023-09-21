export function formatNumber(number: number) {
  return number.toLocaleString('en-US', { maximumFractionDigits: 2 }).replace(/,/g, ' ')
}

export function computePercent(number: number, total: number) {
  return number === 0 ? 0 : number / total * 100;
}
