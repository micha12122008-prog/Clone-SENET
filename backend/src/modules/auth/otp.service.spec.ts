import { BadRequestException } from '@nestjs/common';
import { OtpService } from './otp.service';

describe('OtpService', () => {
  let service: OtpService;

  beforeEach(() => {
    service = new OtpService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOtp', () => {
    it('should generate a 6-digit code and return expiresInSeconds', () => {
      const res = service.generateOtp('+380991112233', 'REGISTRATION');
      expect(res.code).toBeDefined();
      expect(res.code).toHaveLength(6);
      expect(res.expiresInSeconds).toBe(300);
      expect(service.getActiveCode('+380991112233', 'REGISTRATION')).toBe(res.code);
    });

    it('should throw BadRequestException if target is empty', () => {
      expect(() => service.generateOtp('', 'REGISTRATION')).toThrow(BadRequestException);
    });
  });

  describe('verifyOtp', () => {
    it('should verify valid code for matching target and purpose', () => {
      const generated = service.generateOtp('+380991112233', 'REGISTRATION');
      const verified = service.verifyOtp('+380991112233', generated.code, 'REGISTRATION');
      expect(verified).toBe(true);
    });

    it('should throw BadRequestException for invalid code', () => {
      service.generateOtp('+380991112233', 'REGISTRATION');
      expect(() => service.verifyOtp('+380991112233', '000000', 'REGISTRATION')).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for unknown target', () => {
      expect(() => service.verifyOtp('+380999999999', '123456', 'REGISTRATION')).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if code is expired', () => {
      const generated = service.generateOtp('+380991112233', 'REGISTRATION', -1);
      expect(() => service.verifyOtp('+380991112233', generated.code, 'REGISTRATION')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('consumeOtp', () => {
    it('should verify and immediately delete the OTP code', () => {
      const generated = service.generateOtp('user@test.com', 'PASSWORD_RESET');
      const consumed = service.consumeOtp('user@test.com', generated.code, 'PASSWORD_RESET');
      expect(consumed).toBe(true);
      // Second attempt must fail
      expect(() => service.consumeOtp('user@test.com', generated.code, 'PASSWORD_RESET')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('changeTarget', () => {
    it('should invalidate old target and issue new OTP for new target', () => {
      const oldOtp = service.generateOtp('+380991112233', 'REGISTRATION');
      const newOtp = service.changeTarget('+380991112233', '+380994445566', 'REGISTRATION');

      expect(newOtp.code).toBeDefined();
      expect(newOtp.code).toHaveLength(6);
      expect(service.getActiveCode('+380991112233', 'REGISTRATION')).toBeNull();
      expect(service.getActiveCode('+380994445566', 'REGISTRATION')).toBe(newOtp.code);
    });
  });
});
