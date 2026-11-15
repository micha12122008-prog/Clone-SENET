export type OtpVerificationType = 'REGISTRATION' | 'PASSWORD_RESET' | 'LOGIN'

export interface RegisterRequestDto {
  firstName: string
  username: string
  phone: string
  email: string
  password: string
  birthDate: string
}

export interface LoginRequestDto {
  login: string
  password: string
}

export interface SendOtpRequestDto {
  target: string
  type?: OtpVerificationType
}

export interface VerifyOtpRequestDto {
  target: string
  code: string
}

export interface ResetPasswordRequestDto {
  target: string
  code: string
  newPassword: string
}

export interface AuthUserDto {
  id: string
  username?: string
  login?: string
  email?: string
  phone?: string
  firstName?: string
  birthDate?: string
  role: string
  level?: number
  balance?: number
  bonusBalance?: number
  avatarFrame?: string
}

export interface AuthSession {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  user: AuthUserDto
}

export interface DevOtpResult {
  target: string
  devOtpCode: string
  message: string
  expiresInSeconds: number
  rawResponse: Record<string, unknown>
}

export interface RegisterResult {
  user: AuthUserDto
  otp: DevOtpResult
}
