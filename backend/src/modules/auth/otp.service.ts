import { BadRequestException, Injectable, Logger } from '@nestjs/common';

export interface OtpRecord {
  target: string;
  code: string;
  purpose: string;
  expiresAt: number;
  verified: boolean;
  createdAt: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpStore = new Map<string, OtpRecord>();
  private readonly DEFAULT_TTL_SECONDS = 300; // 5 хвилин

  private normalizeTarget(target: string): string {
    if (!target) return '';
    const trimmed = target.trim();
    if (trimmed.includes('@')) {
      return trimmed.toLowerCase();
    }
    return trimmed;
  }

  private buildKey(target: string, purpose: string): string {
    return `${this.normalizeTarget(target)}:${purpose.toUpperCase()}`;
  }

  /**
   * Генерація або оновлення OTP для вказаного target (email або номер телефону)
   */
  generateOtp(
    target: string,
    purpose: string = 'REGISTRATION',
    ttlSeconds: number = this.DEFAULT_TTL_SECONDS,
  ): { code: string; expiresInSeconds: number } {
    const normalized = this.normalizeTarget(target);
    if (!normalized) {
      throw new BadRequestException('Вкажіть номер телефону або email для генерації OTP');
    }

    // Генерація 6-значного числового коду
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const expiresAt = now + ttlSeconds * 1000;
    const key = this.buildKey(normalized, purpose);

    const record: OtpRecord = {
      target: normalized,
      code,
      purpose: purpose.toUpperCase(),
      expiresAt,
      verified: false,
      createdAt: now,
    };

    this.otpStore.set(key, record);
    this.logger.log(`[Dev OTP] Target: ${normalized} | Purpose: ${purpose} | Code: ${code} | Expires in: ${ttlSeconds}s`);

    return {
      code,
      expiresInSeconds: ttlSeconds,
    };
  }

  /**
   * Перевірка валідності введеного OTP коду
   */
  verifyOtp(target: string, code: string, purpose: string = 'REGISTRATION'): boolean {
    const normalized = this.normalizeTarget(target);
    const key = this.buildKey(normalized, purpose);
    const record = this.otpStore.get(key);

    if (!record) {
      throw new BadRequestException(
        'Код підтвердження не знайдено або термін його дії минув. Замовте новий код.',
      );
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(key);
      throw new BadRequestException('Термін дії коду підтвердження минув. Замовте новий код.');
    }

    if (record.code !== code.trim()) {
      throw new BadRequestException('Невірний код підтвердження.');
    }

    record.verified = true;
    return true;
  }

  /**
   * Одноразове використання та видалення коду (наприклад, для скидання пароля)
   */
  consumeOtp(target: string, code: string, purpose: string = 'PASSWORD_RESET'): boolean {
    this.verifyOtp(target, code, purpose);
    const normalized = this.normalizeTarget(target);
    const key = this.buildKey(normalized, purpose);
    this.otpStore.delete(key);
    return true;
  }

  /**
   * Зміна контакту (email або телефону) для верифікації
   */
  changeTarget(
    oldTarget: string,
    newTarget: string,
    purpose: string = 'REGISTRATION',
  ): { code: string; expiresInSeconds: number } {
    const normalizedOld = this.normalizeTarget(oldTarget);
    const normalizedNew = this.normalizeTarget(newTarget);

    if (!normalizedNew) {
      throw new BadRequestException('Вкажіть новий контактний номер або email');
    }

    if (normalizedOld) {
      const oldKey = this.buildKey(normalizedOld, purpose);
      this.otpStore.delete(oldKey);
    }

    return this.generateOtp(normalizedNew, purpose);
  }

  /**
   * Отримання поточного активного коду (для тестування та dev-режиму)
   */
  getActiveCode(target: string, purpose: string = 'REGISTRATION'): string | null {
    const key = this.buildKey(this.normalizeTarget(target), purpose);
    const record = this.otpStore.get(key);
    if (!record || Date.now() > record.expiresAt) {
      return null;
    }
    return record.code;
  }
}
