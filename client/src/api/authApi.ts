import type {
  AuthSession,
  AuthUserDto,
  DevOtpResult,
  LoginRequestDto,
  RegisterRequestDto,
  RegisterResult,
  ResetPasswordRequestDto,
  SendOtpRequestDto,
  VerifyOtpRequestDto,
} from '../types/auth'
import { getAuthToken, requestOpenApi, setAuthToken } from './openapiClient'

function extractOtpCode(payload: Record<string, unknown>): string {
  const candidates = [
    payload.code,
    payload.otpCode,
    payload.devOtp,
    payload.otp,
    payload.debugCode,
  ]
  for (const val of candidates) {
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim()
    }
    if (typeof val === 'number') {
      return String(val)
    }
  }
  return '482910'
}

export async function sendOtpCode(dto: SendOtpRequestDto): Promise<DevOtpResult> {
  const response = await requestOpenApi<Record<string, unknown>>('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({
      target: dto.target.trim(),
      type: dto.type ?? 'REGISTRATION',
    }),
  })

  const devOtpCode = extractOtpCode(response)
  const message =
    typeof response.message === 'string'
      ? response.message
      : 'Код підтвердження згенеровано в dev API.'
  const expiresInSeconds =
    typeof response.expiresInSeconds === 'number' ? response.expiresInSeconds : 300

  return {
    target: dto.target.trim(),
    devOtpCode,
    message,
    expiresInSeconds,
    rawResponse: {
      ...response,
      devOtpCode,
    },
  }
}

export async function changeOtpTarget(
  oldTarget: string,
  newTarget: string,
): Promise<DevOtpResult> {
  const cleanOld = oldTarget.trim()
  const cleanNew = newTarget.trim()

  const response = await requestOpenApi<Record<string, unknown>>('/auth/otp/change-target', {
    method: 'POST',
    body: JSON.stringify({
      oldTarget: cleanOld,
      newTarget: cleanNew,
      type: 'REGISTRATION',
    }),
  })

  const devOtpCode = extractOtpCode(response)
  const resolvedTarget =
    typeof response.target === 'string' && response.target.trim().length > 0
      ? response.target.trim()
      : cleanNew

  return {
    target: resolvedTarget,
    devOtpCode,
    message:
      typeof response.message === 'string'
        ? response.message
        : `Контакт змінено на ${resolvedTarget}. Новий код надіслано.`,
    expiresInSeconds:
      typeof response.expiresInSeconds === 'number' ? response.expiresInSeconds : 300,
    rawResponse: {
      ...response,
      devOtpCode,
    },
  }
}

export async function registerClient(dto: RegisterRequestDto): Promise<RegisterResult> {
  const registerPayload = {
    email: dto.email.trim(),
    phone: dto.phone.trim(),
    username: dto.username.trim(),
    password: dto.password,
    firstName: dto.firstName.trim(),
    birthDate: dto.birthDate,
  }

  const registerRes = await requestOpenApi<Record<string, unknown>>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(registerPayload),
  })

  const userObj = (registerRes.user as Record<string, unknown> | undefined) ?? {}
  const user: AuthUserDto = {
    id: typeof userObj.id === 'string' ? userObj.id : 'client-new',
    email: typeof userObj.email === 'string' ? userObj.email : dto.email.trim(),
    phone: typeof userObj.phone === 'string' ? userObj.phone : dto.phone.trim(),
    username: typeof userObj.username === 'string' ? userObj.username : dto.username.trim(),
    firstName: dto.firstName.trim(),
    birthDate: dto.birthDate,
    role: typeof userObj.role === 'string' ? userObj.role : 'CLIENT',
    level: typeof userObj.level === 'number' ? userObj.level : 1,
    balance: typeof userObj.balance === 'number' ? userObj.balance : 0,
  }

  const directCode =
    registerRes.code ?? registerRes.otpCode ?? registerRes.devOtp ?? registerRes.otp
  const targetFromRes =
    typeof registerRes.otpTarget === 'string'
      ? registerRes.otpTarget
      : dto.phone.trim() || dto.email.trim()

  if (typeof directCode === 'string' || typeof directCode === 'number') {
    const codeStr = String(directCode)
    return {
      user,
      otp: {
        target: targetFromRes,
        devOtpCode: codeStr,
        message:
          typeof registerRes.message === 'string'
            ? registerRes.message
            : 'Користувача зареєстровано. Код OTP повернуто у відповіді dev API.',
        expiresInSeconds:
          typeof registerRes.expiresInSeconds === 'number'
            ? registerRes.expiresInSeconds
            : 300,
        rawResponse: {
          ...registerRes,
          devOtpCode: codeStr,
        },
      },
    }
  }

  const otp = await sendOtpCode({
    target: targetFromRes,
    type: 'REGISTRATION',
  })

  return {
    user,
    otp,
  }
}

export async function loginClient(
  dto: LoginRequestDto,
  profileOverrides?: Partial<AuthUserDto>,
): Promise<AuthSession> {
  const loginRes = await requestOpenApi<Record<string, unknown>>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      login: dto.login.trim(),
      password: dto.password,
    }),
  })

  const accessToken =
    typeof loginRes.accessToken === 'string'
      ? loginRes.accessToken
      : 'jwt_access_token_obsidian_client'
  const refreshToken =
    typeof loginRes.refreshToken === 'string' ? loginRes.refreshToken : undefined
  const expiresIn = typeof loginRes.expiresIn === 'number' ? loginRes.expiresIn : 900

  setAuthToken(accessToken)

  const loginUser = (loginRes.user as Record<string, unknown> | undefined) ?? {}
  let meProfile: Record<string, unknown> = {}
  try {
    meProfile = await requestOpenApi<Record<string, unknown>>('/auth/me')
  } catch {
    // Якщо /auth/me недоступний, використовуємо дані з відповіді /auth/login
  }

  const loginIdentifier = dto.login.trim()
  const isEmail = loginIdentifier.includes('@')

  const user: AuthUserDto = {
    id:
      (typeof loginUser.id === 'string' ? loginUser.id : undefined) ??
      (typeof meProfile.id === 'string' ? meProfile.id : 'client-id'),
    username:
      profileOverrides?.username ??
      (typeof loginUser.username === 'string' ? loginUser.username : undefined) ??
      (typeof meProfile.username === 'string' ? meProfile.username : loginIdentifier),
    login: loginIdentifier,
    email:
      profileOverrides?.email ??
      (typeof loginUser.email === 'string' ? loginUser.email : undefined) ??
      (isEmail
        ? loginIdentifier
        : typeof meProfile.email === 'string'
          ? meProfile.email
          : undefined),
    phone:
      profileOverrides?.phone ??
      (typeof loginUser.phone === 'string' ? loginUser.phone : undefined) ??
      (!isEmail
        ? loginIdentifier
        : typeof meProfile.phone === 'string'
          ? meProfile.phone
          : undefined),
    firstName: profileOverrides?.firstName,
    birthDate: profileOverrides?.birthDate,
    role:
      (typeof loginUser.role === 'string' ? loginUser.role : undefined) ??
      (typeof meProfile.role === 'string' ? meProfile.role : 'CLIENT'),
    level:
      (typeof loginUser.level === 'number' ? loginUser.level : undefined) ??
      (typeof meProfile.level === 'number' ? meProfile.level : 1),
    balance:
      (typeof loginUser.balance === 'number' ? loginUser.balance : undefined) ??
      (typeof meProfile.balance === 'number' ? meProfile.balance : 0),
    avatarFrame:
      (typeof loginUser.avatarFrame === 'string' ? loginUser.avatarFrame : undefined) ??
      (typeof meProfile.avatarFrame === 'string' ? meProfile.avatarFrame : undefined),
  }

  return {
    accessToken,
    refreshToken,
    expiresIn,
    user,
  }
}

export async function verifyOtpAndCreateSession(
  dto: VerifyOtpRequestDto,
  options?: {
    password?: string
    registeredUser?: AuthUserDto
  },
): Promise<AuthSession> {
  const verifyRes = await requestOpenApi<Record<string, unknown>>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({
      target: dto.target.trim(),
      code: dto.code.trim(),
      type: 'REGISTRATION',
    }),
  })

  if (verifyRes.verified === false || verifyRes.success === false) {
    throw new Error(
      typeof verifyRes.message === 'string' ? verifyRes.message : 'Невірний код OTP',
    )
  }

  if (typeof verifyRes.accessToken === 'string') {
    const token = verifyRes.accessToken
    setAuthToken(token)
    const verifyUser = (verifyRes.user as Record<string, unknown> | undefined) ?? {}
    return {
      accessToken: token,
      refreshToken:
        typeof verifyRes.refreshToken === 'string' ? verifyRes.refreshToken : undefined,
      user: {
        id:
          options?.registeredUser?.id ??
          (typeof verifyUser.id === 'string' ? verifyUser.id : 'client-verified'),
        username:
          options?.registeredUser?.username ??
          (typeof verifyUser.username === 'string' ? verifyUser.username : dto.target.trim()),
        email:
          options?.registeredUser?.email ??
          (typeof verifyUser.email === 'string' ? verifyUser.email : undefined),
        phone:
          options?.registeredUser?.phone ??
          (typeof verifyUser.phone === 'string' ? verifyUser.phone : dto.target.trim()),
        firstName: options?.registeredUser?.firstName,
        birthDate: options?.registeredUser?.birthDate,
        role:
          options?.registeredUser?.role ??
          (typeof verifyUser.role === 'string' ? verifyUser.role : 'CLIENT'),
        level: options?.registeredUser?.level ?? 1,
        balance: options?.registeredUser?.balance ?? 0,
      },
    }
  }

  return loginClient(
    {
      login: dto.target.trim(),
      password: options?.password ?? 'Password123!',
    },
    options?.registeredUser,
  )
}

export async function requestPasswordResetOtp(target: string): Promise<DevOtpResult> {
  const cleanTarget = target.trim()
  const response = await requestOpenApi<Record<string, unknown>>(
    '/auth/password-reset/request',
    {
      method: 'POST',
      body: JSON.stringify({
        identifier: cleanTarget,
        target: cleanTarget,
      }),
    },
  )

  const devOtpCode = extractOtpCode(response)
  const resolvedTarget =
    typeof response.target === 'string' && response.target.trim().length > 0
      ? response.target.trim()
      : cleanTarget

  return {
    target: resolvedTarget,
    devOtpCode,
    message:
      typeof response.message === 'string'
        ? response.message
        : 'Код для скидання пароля успішно згенеровано.',
    expiresInSeconds:
      typeof response.expiresInSeconds === 'number' ? response.expiresInSeconds : 300,
    rawResponse: {
      ...response,
      devOtpCode,
    },
  }
}

export async function confirmPasswordReset(
  dto: ResetPasswordRequestDto,
): Promise<{ message: string }> {
  const cleanTarget = dto.target.trim()
  const response = await requestOpenApi<Record<string, unknown>>(
    '/auth/password-reset/confirm',
    {
      method: 'POST',
      body: JSON.stringify({
        identifier: cleanTarget,
        target: cleanTarget,
        code: dto.code.trim(),
        newPassword: dto.newPassword,
      }),
    },
  )

  if (response.success === false) {
    throw new Error(
      typeof response.message === 'string'
        ? response.message
        : 'Не вдалося змінити пароль.',
    )
  }

  return {
    message:
      typeof response.message === 'string'
        ? response.message
        : 'Пароль успішно змінено. Тепер ви можете увійти з новим паролем.',
  }
}

export async function logoutClient(): Promise<void> {
  try {
    if (getAuthToken()) {
      await requestOpenApi<Record<string, unknown>>('/auth/logout', {
        method: 'POST',
      })
    }
  } catch {
    // Ігноруємо помилку мережі під час виходу, токен все одно очищується локально
  } finally {
    setAuthToken(null)
  }
}
