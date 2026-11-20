import { BadRequestException } from '@nestjs/common';
import { PlaceStatus } from '@prisma/client';

export const UKRAINIAN_PLACE_STATUSES = ['вільно', 'зайнято', 'бронь', 'ремонт'] as const;
export type UkrainianPlaceStatus = (typeof UKRAINIAN_PLACE_STATUSES)[number];

export const PlaceStatusToUkrainian: Record<string, UkrainianPlaceStatus> = {
  FREE: 'вільно',
  BUSY: 'зайнято',
  BOOKED: 'бронь',
  MAINTENANCE: 'ремонт',
  вільно: 'вільно',
  зайнято: 'зайнято',
  бронь: 'бронь',
  ремонт: 'ремонт',
};

export const UkrainianToPlaceStatus: Record<string, PlaceStatus> = {
  вільно: PlaceStatus.FREE,
  зайнято: PlaceStatus.BUSY,
  бронь: PlaceStatus.BOOKED,
  ремонт: PlaceStatus.MAINTENANCE,
  FREE: PlaceStatus.FREE,
  BUSY: PlaceStatus.BUSY,
  BOOKED: PlaceStatus.BOOKED,
  MAINTENANCE: PlaceStatus.MAINTENANCE,
};

export function normalizeToUkrainianStatus(status: string): UkrainianPlaceStatus {
  const normalized = PlaceStatusToUkrainian[status];
  if (!normalized) {
    throw new BadRequestException(
      `Неприпустимий статус місця: "${status}". Дозволені значення: ${UKRAINIAN_PLACE_STATUSES.join(', ')}`,
    );
  }
  return normalized;
}

export function normalizeToPrismaStatus(status: string): PlaceStatus {
  const prismaStatus = UkrainianToPlaceStatus[status];
  if (!prismaStatus) {
    throw new BadRequestException(
      `Неприпустимий статус місця: "${status}". Дозволені значення: ${UKRAINIAN_PLACE_STATUSES.join(', ')}`,
    );
  }
  return prismaStatus;
}

/**
 * Валідація допустимості переходу між статусами місця
 */
export function validateStatusTransition(
  currentStatus: UkrainianPlaceStatus,
  targetStatus: UkrainianPlaceStatus,
): void {
  // Однаковий статус - ідемпотентно
  if (currentStatus === targetStatus) {
    return;
  }

  // Переходи зі статусу 'ремонт' дозволені виключно у 'вільно' (після завершення робіт)
  if (currentStatus === 'ремонт' && targetStatus !== 'вільно') {
    throw new BadRequestException(
      `Неможливо перевести місце зі статусу "ремонт" у "${targetStatus}". Спочатку завершіть ремонт і переведіть місце у статус "вільно".`,
    );
  }

  // Переходи зі статусу 'зайнято' (активна сесія) не можуть переводитися у 'бронь' без звільнення
  if (currentStatus === 'зайнято' && targetStatus === 'бронь') {
    throw new BadRequestException(
      `Неможливо забронювати зайняте місце. Спочатку завершіть поточну сесію.`,
    );
  }
}
