import { Prisma } from '@prisma/client';

export type Decimalish = Prisma.Decimal | number | string;

export function toDecimal(val: Decimalish): Prisma.Decimal {
  if (val instanceof Prisma.Decimal) return val;

  if (typeof val === 'number') return new Prisma.Decimal(val);

  // string: aceita "23200.00" ou "23.200,00"
  let s = val.trim();
  if (/[,]/.test(s) && /[.]/.test(s)) {
    // remove separador de milhar, troca vírgula por ponto
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/,/.test(s)) {
    s = s.replace(',', '.');
  }
  return new Prisma.Decimal(s);
}

export function toMoney2(val: Decimalish): Prisma.Decimal {
  return toDecimal(val).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}
