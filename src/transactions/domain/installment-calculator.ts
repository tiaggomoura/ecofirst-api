import { Prisma } from '@prisma/client';
import { toMoney2 } from './money';

/**
 * Divide o total em `count` parcelas (2 casas), garantindo soma exata.
 */
export function splitIntoInstallments(
  total: Prisma.Decimal,
  count: number,
): Prisma.Decimal[] {
  const n = Math.max(1, count);
  const cents = total.mul(100);
  const base = cents.divToInt(n); // parte inteira (em centavos)
  const remainder = cents.mod(n).toNumber(); // resto em centavos

  const parcels: Prisma.Decimal[] = [];
  for (let i = 0; i < n; i++) {
    // distribui 1 centavo aos primeiros "remainder"
    const thisCents = base.add(i < remainder ? 1 : 0);
    parcels.push(toMoney2(thisCents.div(100)));
  }
  return parcels;
}
