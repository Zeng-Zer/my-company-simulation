// impot 2023 sur le revenu 2022
const impots = [
  {
    low: 0,
    high: 10777,
    toPay: 0,
    rate: 0,
  },
  {
    low: 10778,
    high: 27478,
    rate: 0.11,
  },
  {
    low: 27479,
    high: 78570,
    rate: 0.30,
  },
  {
    low: 78571,
    high: 168994,
    rate: 0.41,
  },
  {
    low: 168994,
    high: Number.POSITIVE_INFINITY,
    rate: 0.45,
  },
];

export function getImpotRange(parts = 1) {
  return impots.map(({ low, high, rate }) => ({
    low: low * parts,
    high: high * parts,
    rate,
  }));
}