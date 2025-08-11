/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { $Enums, Category, PaymentMethod, Transaction } from '@prisma/client';

/** Entidade com relações opcionais (caso alguém chame o mapper sem include). */
export type TransactionWithRefs = Transaction & {
  category?: Category | null;
  paymentMethod?: PaymentMethod | null;
};

/** DTO enxuto para listagens */
export interface TransactionListItemDTO {
  id: number;
  description: string;
  amount: number; // sempre number
  date: string; // ISO string para facilitar no front
  type: $Enums.TransactionType;
  status: $Enums.TransactionStatus;
  category?: { id: number; name: string } | null;
  paymentMethod?: { id: number; name: string } | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
}

/** DTO detalhado (caso precise em telas de detalhe) */
export interface TransactionDetailDTO extends TransactionListItemDTO {
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** DTO de Recent Activity */
export interface RecentActivityItemDTO {
  id: number;
  description: string;
  amount: number; // sempre number
  date: string; // ISO
  type: $Enums.TransactionType;
  status: $Enums.TransactionStatus;
  categoryName?: string | null;
}

/**
 * Converte Decimal | string | number em number.
 * Ponto único de conversão para evitar amount como string no front.
 */
export function toNumberAmount(value: unknown): number {
  if (value == null) return 0;
  const maybeDecimal = value as unknown;
  if (
    typeof maybeDecimal === 'object' &&
    maybeDecimal !== null &&
    'toNumber' in maybeDecimal &&
    typeof (maybeDecimal as { toNumber: unknown }).toNumber === 'function'
  ) {
    return Number((maybeDecimal as { toNumber: () => number }).toNumber());
  }
  return Number(value);
}

/** Normaliza Date para ISO string */
export function toISO(date: Date | string): string {
  return (date instanceof Date ? date : new Date(date)).toISOString();
}

/** Mapper genérico para listagem */
export function toListItemDTO(t: TransactionWithRefs): TransactionListItemDTO {
  return {
    id: t.id,
    description: t.description,
    amount: toNumberAmount(t.amount), // ✅ conversão garantida
    date: toISO(t.date as any),
    type: t.type,
    status: t.status,
    category: t.category ? { id: t.category.id, name: t.category.name } : null,
    paymentMethod: t.paymentMethod
      ? { id: t.paymentMethod.id, name: t.paymentMethod.name }
      : null,
    installmentNumber: t.installmentNumber ?? null,
    installmentTotal: t.installmentTotal ?? null,
  };
}

/** Mapper para detalhe */
export function toDetailDTO(t: TransactionWithRefs): TransactionDetailDTO {
  return {
    ...toListItemDTO(t),
    createdAt: toISO(t.createdAt as any),
    updatedAt: toISO(t.updatedAt as any),
  };
}

/** Mapper específico para Recent Activity */
export function toRecentActivityItemDTO(
  t: TransactionWithRefs,
): RecentActivityItemDTO {
  return {
    id: t.id,
    description: t.description,
    amount: toNumberAmount(t.amount), // ✅ conversão garantida
    date: toISO(t.date as any),
    type: t.type,
    status: t.status,
    categoryName: t.category?.name ?? null,
  };
}
