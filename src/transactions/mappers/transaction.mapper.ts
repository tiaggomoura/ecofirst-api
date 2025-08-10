import { Transaction, Category, PaymentMethod, $Enums } from '@prisma/client';

/** Entidade com relações opcionais (caso alguém chame o mapper sem include). */
export type TransactionWithRefs = Transaction & {
  category?: Category | null;
  paymentMethod?: PaymentMethod | null;
};

/** DTOs que o service expõe ao front */
export interface TransactionListItemDTO {
  id: number;
  description: string;
  amount: number; // normalizado para number
  date: Date; // mantenho Date; ajuste para string ISO se preferir
  type: $Enums.TransactionType;
  status: $Enums.TransactionStatus;
  categoryName: string; // já pronto para listagem
  paymentMethodName: string;
  installmentNumber: number | null;
  installmentTotal: number | null;
}

export interface TransactionDetailDTO {
  id: number;
  description: string;
  amount: number;
  date: Date;
  type: $Enums.TransactionType;
  status: $Enums.TransactionStatus;
  category: { id: number; name: string } | null;
  paymentMethod: { id: number; name: string } | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}

/** Mapper para listagem (campos “achatados” e nomes prontos) */
export function toListItemDTO(t: TransactionWithRefs): TransactionListItemDTO {
  return {
    id: t.id,
    description: t.description,
    amount: Number(t.amount), // Prisma.Decimal -> number
    date: t.date,
    type: t.type,
    status: t.status,
    categoryName: t.category?.name ?? '',
    paymentMethodName: t.paymentMethod?.name ?? '',
    installmentNumber: t.installmentNumber ?? null,
    installmentTotal: t.installmentTotal ?? null,
  };
}

/** Mapper para detalhe (traz objetos aninhados) */
export function toDetailDTO(t: TransactionWithRefs): TransactionDetailDTO {
  return {
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    date: t.date,
    type: t.type,
    status: t.status,
    category: t.category ? { id: t.category.id, name: t.category.name } : null,
    paymentMethod: t.paymentMethod
      ? { id: t.paymentMethod.id, name: t.paymentMethod.name }
      : null,
    installmentNumber: t.installmentNumber ?? null,
    installmentTotal: t.installmentTotal ?? null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}
