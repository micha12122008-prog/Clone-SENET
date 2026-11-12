export type ShellLocale = 'uk' | 'en'

export interface OnboardingStepTranslation {
  id: number
  shortTab: string
  badge: string
  title: string
  description: string
  highlights: string[]
}

export interface ClientTranslations {
  // Shell
  appBadge: string
  navSplash: string
  navOnboarding: string
  navLogin: string
  navRegister: string
  navCabinet: string
  navApiContract: string
  langSwitchHint: string
  apiStatusLabel: string
  apiConnected: string
  apiStubFallback: string
  swaggerDocsLabel: string
  workingHoursLabel: string
  freePlacesLabel: string
  refreshApiButton: string
  footerShellNote: string
  weekBadge: string
  logoutNotice: string

  // Splash
  splashAria: string
  splashBadge: string
  splashSubtitle: string
  splashPlatformsTitle: string
  splashZonesPrefix: string
  splashPlacesTitle: string
  splashFreePrefix: string
  splashOf: string
  splashStatusesNote: string
  splashLocationTitle: string
  splashLoadingApi: string
  splashReadyApi: string
  splashStartOnboardingBtn: string
  splashGoToLoginBtn: string

  // Onboarding
  onboardingAria: string
  onboardingSkipBtn: string
  onboardingZonesHeader: string
  onboardingZonesCountSuffix: string
  onboardingPerHour: string
  onboardingFreeSeats: string
  onboardingStatusFree: string
  onboardingPlaceEnumLabel: string
  onboardingTariffsHeader: string
  onboardingTariffsCountSuffix: string
  onboardingTypePrefix: string
  onboardingMinutesSuffix: string
  onboardingPaymentEnumLabel: string
  onboardingContractsHeader: string
  onboardingContractsDesc: string
  onboardingOrderEnumLabel: string
  onboardingTournamentEnumLabel: string
  onboardingBarPromoTitle: string
  onboardingBarPromoDesc: string
  onboardingBackToSplashBtn: string
  onboardingPrevStepBtn: string
  onboardingStepCounter: (current: number, total: number) => string
  onboardingFinishBtn: string
  onboardingNextStepBtn: string
  onboardingSteps: OnboardingStepTranslation[]

  // Social Auth Buttons
  socialHeader: string
  socialSoonBadge: string

  // Register
  registerAria: string
  registerBadge: string
  registerTitle: string
  registerSubtitle: string
  registerFirstNameLabel: string
  registerFirstNamePlaceholder: string
  registerUsernameLabel: string
  registerUsernamePlaceholder: string
  registerPhoneLabel: string
  registerEmailLabel: string
  registerPasswordLabel: string
  registerConfirmPasswordLabel: string
  registerShowPassword: string
  registerHidePassword: string
  registerPasswordMatch: string
  registerPasswordMismatch: string
  registerBirthDateLabel: string
  registerAgreePrefix: string
  registerAgreeSuffix: string
  registerSubmittingBtn: string
  registerSubmitBtn: string
  registerHasAccountPrompt: string
  registerSwitchToLoginBtn: string
  errFirstName: string
  errUsername: string
  errPhone: string
  errEmail: string
  errPasswordLength: string
  errPasswordMismatch: string
  errBirthDate: string
  errAgreeRules: string

  // Login
  loginAria: string
  loginBadge: string
  loginTitle: string
  loginSubtitle: string
  loginIdentifierLabel: string
  loginIdentifierPlaceholder: string
  loginPasswordLabel: string
  loginForgotPasswordBtn: string
  loginSubmittingBtn: string
  loginSubmitBtn: string
  loginNoAccountPrompt: string
  loginSwitchToRegisterBtn: string
  errLoginIdentifier: string
  errLoginPassword: string

  // OTP
  otpAria: string
  otpBadge: string
  otpTitle: string
  otpSubtitlePrefix: string
  otpDevApiHeader: string
  otpDevApiDesc: string
  otpCodeChipPrefix: string
  otpInputLabel: string
  otpVerifyingBtn: string
  otpVerifyBtn: string
  otpResendingBtn: string
  otpResendBtn: string
  otpCancelChangeBtn: string
  otpChangeTargetBtn: string
  otpNewTargetLabel: string
  otpNewTargetPlaceholder: string
  otpApplyTargetBtn: string
  otpBackToRegisterBtn: string
  otpResentStatus: (target: string) => string
  otpChangedTargetStatus: (target: string) => string
  errOtpCode: string
  errOtpNewTarget: string

  // Password Reset
  resetAria: string
  resetBadge: string
  resetTitle: string
  resetSubtitle: string
  resetTargetLabel: string
  resetTargetPlaceholder: string
  resetResendCodeBtn: string
  resetGetCodeBtn: string
  resetDevApiHeader: string
  resetCodeLabel: string
  resetNewPasswordLabel: string
  resetConfirmPasswordLabel: string
  resetSavingBtn: string
  resetSubmitBtn: string
  resetBackToLoginBtn: string
  errResetTarget: string
  errResetCode: string

  // Cabinet
  cabinetAria: string
  cabinetBadgePrefix: string
  cabinetWelcomePrefix: string
  cabinetSubtitlePrefix: string
  cabinetLogoutBtn: string
  cabinetNicknameLabel: string
  cabinetContactsLabel: string
  cabinetBalanceLabel: string
  cabinetTokenLabel: string

  // OpenAPI Stub View
  openApiAria: string
  openApiBadge: string
  openApiTitle: string
  openApiSubtitle: string
  openApiRefreshingBtn: string
  openApiRefreshBtn: string
  openApiSourceLabel: string
  openApiSourceLive: string
  openApiSourceStub: string
  openApiUpdatedPrefix: string
  openApiCurrencyPrefix: string
  openApiGoToSplashBtn: string
  openApiGoToOnboardingBtn: string
}

export type ShellLabels = ClientTranslations

export const SHELL_LABELS: Record<ShellLocale, ClientTranslations> = {
  uk: {
    appBadge: 'Клієнтська оболонка',
    navSplash: 'Заставка',
    navOnboarding: 'Онбординг',
    navLogin: 'Вхід',
    navRegister: 'Реєстрація',
    navCabinet: 'Профіль (Токен)',
    navApiContract: 'Скелет OpenAPI',
    langSwitchHint: 'Мова інтерфейсу',
    apiStatusLabel: 'Контракт API',
    apiConnected: 'Сервер OpenAPI активний',
    apiStubFallback: 'Заглушка скелета OpenAPI',
    swaggerDocsLabel: 'Swagger UI',
    workingHoursLabel: 'Режим',
    freePlacesLabel: 'Вільні ПК',
    refreshApiButton: 'Оновити API',
    footerShellNote: 'OBSIDIAN PC CLUB • Клієнтський веб-додаток',
    weekBadge: 'Тиждень 2 • Реєстрація та вхід',
    logoutNotice: 'Ви успішно вийшли з облікового запису.',

    splashAria: 'Заставка OBSIDIAN PC CLUB',
    splashBadge: 'Вайрфрейм заставки • Клієнтський веб-додаток',
    splashSubtitle:
      'Кіберспортивний простір нового покоління. Обирайте ігрову зону, бронюйте місця онлайн, керуйте сесією та замовляйте з бару прямо до комп’ютера.',
    splashPlatformsTitle: 'Ігрові платформи',
    splashZonesPrefix: 'Зони',
    splashPlacesTitle: 'Статус місць (OpenAPI)',
    splashFreePrefix: 'Вільно',
    splashOf: 'із',
    splashStatusesNote: 'Статуси: вільно • зайнято • бронь • ремонт',
    splashLocationTitle: 'Локація та графік',
    splashLoadingApi: 'Завантаження контракту OpenAPI...',
    splashReadyApi: 'Клієнтський каркас ініціалізовано',
    splashStartOnboardingBtn: 'Розпочати короткий онбординг →',
    splashGoToLoginBtn: 'Перейти до входу / реєстрації',

    onboardingAria: 'Короткий онбординг клієнта',
    onboardingSkipBtn: 'Пропустити онбординг →',
    onboardingZonesHeader: 'Дані OpenAPI • GET /api/zones',
    onboardingZonesCountSuffix: 'зони',
    onboardingPerHour: 'грн/год',
    onboardingFreeSeats: 'Вільні місця',
    onboardingStatusFree: 'статус: вільно',
    onboardingPlaceEnumLabel: 'Фіксований enum статусів місця:',
    onboardingTariffsHeader: 'Дані OpenAPI • GET /api/tariffs',
    onboardingTariffsCountSuffix: 'тарифи',
    onboardingTypePrefix: 'Тип',
    onboardingMinutesSuffix: 'хв',
    onboardingPaymentEnumLabel: 'Фіксований enum способів оплати:',
    onboardingContractsHeader: 'Фіксовані контракти Тижня 1',
    onboardingContractsDesc:
      'Статуси замовлень бару та турнірів узгоджені між клієнтом, адмінкою та NestJS API:',
    onboardingOrderEnumLabel: 'Статуси замовлення бару (OrderStatus):',
    onboardingTournamentEnumLabel: 'Статуси турнірів (TournamentStatus):',
    onboardingBarPromoTitle: 'Акція бару «Димочок»',
    onboardingBarPromoDesc:
      'Спеціальна позиція меню бару з доставкою до ігрового місця під час активної сесії.',
    onboardingBackToSplashBtn: '← Повернутися на заставку',
    onboardingPrevStepBtn: '← Попередній крок',
    onboardingStepCounter: (current, total) => `Крок ${current} із ${total}`,
    onboardingFinishBtn: 'Завершити онбординг ✓',
    onboardingNextStepBtn: 'Наступний крок →',
    onboardingSteps: [
      {
        id: 1,
        shortTab: 'Зони',
        badge: 'Крок 1 із 3 • Зали та обладнання',
        title: 'Обирайте ігрову зону: PC, PS5 або VR',
        description:
          'У клубі OBSIDIAN PC CLUB доступні зали Standard, VIP RTX 4090, командний Bootcamp 5×5, консольна зона PS5 та VR-кімната. Актуальна зайнятість місць завантажується з API.',
        highlights: [
          'Прозорий розподіл за типами пристроїв: потужні ПК, консолі PlayStation та VR-станції',
          'Фіксовані статуси місць у системі: вільно, зайнято, бронь, ремонт',
          'Характеристики обладнання та базовий погодинний тариф у гривнях для кожного залу',
        ],
      },
      {
        id: 2,
        shortTab: 'Бронювання',
        badge: 'Крок 2 із 3 • Бронювання та пакети',
        title: 'Бронюйте місце на 1–3 години або пакет 3+1',
        description:
          'Вибирайте зручну дату, час і тривалість або комбо-пакет 3+1 (місце бронюється на 4 години, а до сплати рахується 3 години). Для команд доступний вибір сусідніх місць.',
        highlights: [
          'Тимчасове утримання обраного місця на 10 хвилин під час оформлення броні',
          'Додаткові опції до броні: напої, снеки, другий геймпад або супровід VR-оператора',
          'Безкоштовне скасування чи перенесення броні не пізніше ніж за 2 години до старту',
        ],
      },
      {
        id: 3,
        shortTab: 'Сесія та бар',
        badge: 'Крок 3 із 3 • Сесія, бар і турніри',
        title: 'Керуйте живою сесією, замовляйте з бару та змагайтеся',
        description:
          'Після швидкого чек-іну за QR-кодом у клубі відстежуйте таймер сесії, поповнюйте баланс, замовляйте позиції з меню бару прямо до столу та реєструйтеся на турніри.',
        highlights: [
          'Єдина шкала статусів замовлення бару: нове (new) → готується (preparing) → видано (issued)',
          'Турніри з CS2, Dota 2, Valorant та FIFA зі статусами: реєстрація, live, завершено',
          'Чотири клубні досягнення: 10 годин, 50 годин, «Рання пташка» (до 08:00) та 10 напоїв за сесію',
        ],
      },
    ],

    socialHeader: 'Соціальний вхід (інтеграції недоступні на цьому етапі)',
    socialSoonBadge: 'скоро',

    registerAria: 'Реєстрація клієнта',
    registerBadge: 'Тиждень 2 • Реєстрація клієнта',
    registerTitle: 'Створення облікового запису OBSIDIAN PC CLUB',
    registerSubtitle:
      'Заповніть анкету гравця. Після відправки форми відкриється екран підтвердження коду OTP.',
    registerFirstNameLabel: 'Ім’я *',
    registerFirstNamePlaceholder: 'Олександр',
    registerUsernameLabel: 'Нік (нікнейм) *',
    registerUsernamePlaceholder: 's1mple_pro',
    registerPhoneLabel: 'Телефон *',
    registerEmailLabel: 'Email *',
    registerPasswordLabel: 'Пароль (мін. 6 символів) *',
    registerConfirmPasswordLabel: 'Підтвердження пароля *',
    registerShowPassword: 'Показати',
    registerHidePassword: 'Сховати',
    registerPasswordMatch: 'Збігається ✓',
    registerPasswordMismatch: 'Не збігається',
    registerBirthDateLabel: 'Дата народження *',
    registerAgreePrefix: 'Я погоджуюся з правилами комп’ютерного клубу',
    registerAgreeSuffix: 'та умовами користування обліковим записом *',
    registerSubmittingBtn: 'Реєстрація та отримання OTP...',
    registerSubmitBtn: 'Зареєструватися і отримати код OTP →',
    registerHasAccountPrompt: 'Вже маєте обліковий запис?',
    registerSwitchToLoginBtn: 'Увійти в акаунт',
    errFirstName: 'Введіть ваше ім’я.',
    errUsername: 'Введіть нікнейм гравця.',
    errPhone: 'Введіть коректний номер телефону (щонайменше 10 символів, наприклад +380991112233).',
    errEmail: 'Введіть коректну адресу електронної пошти.',
    errPasswordLength: 'Пароль має містити щонайменше 6 символів.',
    errPasswordMismatch: 'Пароль і підтвердження пароля не збігаються.',
    errBirthDate: 'Вкажіть дату народження.',
    errAgreeRules: 'Необхідно погодитися з правилами клубу.',

    loginAria: 'Вхід клієнта',
    loginBadge: 'Тиждень 2 • Вхід клієнта',
    loginTitle: 'Вхід до OBSIDIAN PC CLUB',
    loginSubtitle: 'Авторизуйтеся за допомогою email або номера телефону та пароля.',
    loginIdentifierLabel: 'Email або телефон *',
    loginIdentifierPlaceholder: 'player1@gmail.com або +380993334455',
    loginPasswordLabel: 'Пароль *',
    loginForgotPasswordBtn: 'Забули пароль?',
    loginSubmittingBtn: 'Авторизація...',
    loginSubmitBtn: 'Увійти в акаунт →',
    loginNoAccountPrompt: 'Ще немає облікового записy?',
    loginSwitchToRegisterBtn: 'Зареєструватися',
    errLoginIdentifier: 'Введіть email або номер телефону.',
    errLoginPassword: 'Введіть пароль.',

    otpAria: 'Підтвердження коду OTP',
    otpBadge: 'Окремий екран OTP • Верифікація',
    otpTitle: 'Підтвердження облікового запису',
    otpSubtitlePrefix: 'Код підтвердження прив’язано до ідентифікатора:',
    otpDevApiHeader: 'Відповідь dev API (POST /api/auth/otp/send)',
    otpDevApiDesc:
      'Провайдера SMS чи пошти немає — код повертається безпосередньо у відповіді API:',
    otpCodeChipPrefix: 'Код:',
    otpInputLabel: 'Цифровий код підтвердження (OTP) *',
    otpVerifyingBtn: 'Перевірка коду та отримання токена...',
    otpVerifyBtn: 'Підтвердити код і продовжити з токеном →',
    otpResendingBtn: 'Надсилання...',
    otpResendBtn: 'Надіслати код знову',
    otpCancelChangeBtn: 'Скасувати зміну',
    otpChangeTargetBtn: 'Змінити номер або email',
    otpNewTargetLabel: 'Новий номер телефону або email',
    otpNewTargetPlaceholder: '+380991112233 або email@domain.com',
    otpApplyTargetBtn: 'Оновити і надіслати код',
    otpBackToRegisterBtn: '← Повернутися до форми реєстрації',
    otpResentStatus: (target) => `Новий код згенеровано у відповіді dev API для ${target}.`,
    otpChangedTargetStatus: (target) =>
      `Ідентифікатор змінено на ${target}. Надіслано новий код OTP.`,
    errOtpCode: 'Введіть код підтвердження OTP.',
    errOtpNewTarget: 'Вкажіть коректний номер телефону або email.',

    resetAria: 'Скидання пароля',
    resetBadge: 'Відновлення доступу • Без листа і SMS',
    resetTitle: 'Скидання пароля клієнта',
    resetSubtitle:
      'Введіть email або телефон → отримайте код у відповіді dev API → встановіть новий пароль.',
    resetTargetLabel: 'Ідентифікатор (email або телефон) *',
    resetTargetPlaceholder: 'player1@gmail.com або +380993334455',
    resetResendCodeBtn: 'Надіслати код знову',
    resetGetCodeBtn: 'Отримати код у dev API',
    resetDevApiHeader: 'Код скидання з тіла відповіді dev API',
    resetCodeLabel: 'Код підтвердження з відповіді API *',
    resetNewPasswordLabel: 'Новий пароль (мін. 6 символів) *',
    resetConfirmPasswordLabel: 'Підтвердження нового пароля *',
    resetSavingBtn: 'Збереження нового пароля...',
    resetSubmitBtn: 'Підтвердити код і оновити пароль ✓',
    resetBackToLoginBtn: '← Повернутися на екран входу',
    errResetTarget: 'Введіть email або номер телефону облікового запису.',
    errResetCode: 'Введіть код скидання пароля з відповіді API.',

    cabinetAria: 'Авторизований кабінет клієнта',
    cabinetBadgePrefix: 'Авторизовано з JWT токеном • Роль:',
    cabinetWelcomePrefix: 'Вітаємо в OBSIDIAN PC CLUB,',
    cabinetSubtitlePrefix:
      'Ви успішно пройшли авторизацію. Токен доступу збережено та підставляється у заголовки',
    cabinetLogoutBtn: 'Вийти з акаунта',
    cabinetNicknameLabel: 'Нікнейм / Ім’я',
    cabinetContactsLabel: 'Контакти клієнта',
    cabinetBalanceLabel: 'Ігровий баланс',
    cabinetTokenLabel: 'Активний JWT Access Token (використовується для закритих маршрутів API):',

    openApiAria: 'Скелет OpenAPI та каркас клієнта',
    openApiBadge: 'Тиждень 1 • Каркас клієнта готовий',
    openApiTitle: 'Підключення до заглушок скелета OpenAPI',
    openApiSubtitle: 'Цього тижня клієнтський фронтенд ходить у заглушки скелета OpenAPI.',
    openApiRefreshingBtn: 'Оновлення...',
    openApiRefreshBtn: 'Оновити запити до API',
    openApiSourceLabel: 'Джерело даних контракту',
    openApiSourceLive: 'Живий сервер NestJS OpenAPI',
    openApiSourceStub: 'Локальна заглушка скелета OpenAPI',
    openApiUpdatedPrefix: 'Оновлено о',
    openApiCurrencyPrefix: 'Валюта:',
    openApiGoToSplashBtn: 'Відкрити заставку (Splash)',
    openApiGoToOnboardingBtn: 'Пройти онбординг знову',
  },

  en: {
    appBadge: 'Client Shell',
    navSplash: 'Splash',
    navOnboarding: 'Onboarding',
    navLogin: 'Sign In',
    navRegister: 'Sign Up',
    navCabinet: 'Profile (Token)',
    navApiContract: 'OpenAPI Skeleton',
    langSwitchHint: 'Interface language',
    apiStatusLabel: 'API Contract',
    apiConnected: 'OpenAPI Server Live',
    apiStubFallback: 'OpenAPI Skeleton Stub',
    swaggerDocsLabel: 'Swagger UI',
    workingHoursLabel: 'Hours',
    freePlacesLabel: 'Free PCs',
    refreshApiButton: 'Refresh API',
    footerShellNote: 'OBSIDIAN PC CLUB • Client Web Application',
    weekBadge: 'Week 2 • Registration & Sign In',
    logoutNotice: 'You have successfully signed out.',

    splashAria: 'OBSIDIAN PC CLUB Splash Screen',
    splashBadge: 'Splash Wireframe • Client Web App',
    splashSubtitle:
      'Next-generation esports arena. Choose your gaming zone, book seats online, manage your live session, and order from the bar right to your desk.',
    splashPlatformsTitle: 'Gaming Platforms',
    splashZonesPrefix: 'Zones',
    splashPlacesTitle: 'Seat Status (OpenAPI)',
    splashFreePrefix: 'Available',
    splashOf: 'of',
    splashStatusesNote: 'Statuses: вільно • зайнято • бронь • ремонт',
    splashLocationTitle: 'Location & Hours',
    splashLoadingApi: 'Loading OpenAPI contract...',
    splashReadyApi: 'Client skeleton initialized',
    splashStartOnboardingBtn: 'Start quick onboarding →',
    splashGoToLoginBtn: 'Go to Sign In / Sign Up',

    onboardingAria: 'Client Quick Onboarding',
    onboardingSkipBtn: 'Skip onboarding →',
    onboardingZonesHeader: 'OpenAPI Data • GET /api/zones',
    onboardingZonesCountSuffix: 'zones',
    onboardingPerHour: 'UAH/hr',
    onboardingFreeSeats: 'Available seats',
    onboardingStatusFree: 'status: вільно',
    onboardingPlaceEnumLabel: 'Fixed PlaceStatus enum:',
    onboardingTariffsHeader: 'OpenAPI Data • GET /api/tariffs',
    onboardingTariffsCountSuffix: 'tariffs',
    onboardingTypePrefix: 'Type',
    onboardingMinutesSuffix: 'min',
    onboardingPaymentEnumLabel: 'Fixed PaymentMethod enum:',
    onboardingContractsHeader: 'Week 1 Fixed Contracts',
    onboardingContractsDesc:
      'Bar order and tournament statuses are synchronized across Client, Admin, and NestJS API:',
    onboardingOrderEnumLabel: 'Bar Order Statuses (OrderStatus):',
    onboardingTournamentEnumLabel: 'Tournament Statuses (TournamentStatus):',
    onboardingBarPromoTitle: 'Bar Promo "Dymochok"',
    onboardingBarPromoDesc:
      'Special bar menu item delivered directly to your gaming station during an active session.',
    onboardingBackToSplashBtn: '← Back to Splash',
    onboardingPrevStepBtn: '← Previous step',
    onboardingStepCounter: (current, total) => `Step ${current} of ${total}`,
    onboardingFinishBtn: 'Complete onboarding ✓',
    onboardingNextStepBtn: 'Next step →',
    onboardingSteps: [
      {
        id: 1,
        shortTab: 'Zones',
        badge: 'Step 1 of 3 • Rooms & Hardware',
        title: 'Choose your gaming zone: PC, PS5, or VR',
        description:
          'OBSIDIAN PC CLUB features Standard, VIP RTX 4090, team Bootcamp 5×5, PS5 console lounge, and VR room zones. Live seat availability is loaded from the API.',
        highlights: [
          'Clear breakdown by device type: high-end PCs, PlayStation consoles, and VR stations',
          'Fixed seat statuses across the system: вільно, зайнято, бронь, ремонт',
          'Hardware specs and base hourly rate in UAH for every gaming room',
        ],
      },
      {
        id: 2,
        shortTab: 'Booking',
        badge: 'Step 2 of 3 • Booking & Packages',
        title: 'Book a seat for 1–3 hours or grab the 3+1 package',
        description:
          'Pick a convenient date, time, and duration or the 3+1 combo (reserves the seat for 4 hours while charging for only 3 hours). Adjacent seats are available for teams.',
        highlights: [
          'Temporary 10-minute seat hold while completing your booking',
          'Booking extras: drinks, snacks, second gamepad, or VR operator assistance',
          'Free cancellation or rescheduling up to 2 hours before session start',
        ],
      },
      {
        id: 3,
        shortTab: 'Session & Bar',
        badge: 'Step 3 of 3 • Live Session, Bar & Tournaments',
        title: 'Control your live session, order from the bar, and compete',
        description:
          'After quick QR check-in at the club, track your session timer, top up your balance, order bar items right to your desk, and register for tournaments.',
        highlights: [
          'Unified bar order status flow: new → preparing → issued',
          'CS2, Dota 2, Valorant, and FIFA tournaments with statuses: реєстрація, live, завершено',
          'Four club achievements: 10 hours, 50 hours, Early Bird (before 08:00), and 10 drinks in one session',
        ],
      },
    ],

    socialHeader: 'Social Sign-In (integrations unavailable at this stage)',
    socialSoonBadge: 'soon',

    registerAria: 'Client Registration',
    registerBadge: 'Week 2 • Client Registration',
    registerTitle: 'Create an OBSIDIAN PC CLUB Account',
    registerSubtitle:
      'Fill out the player registration form. Submitting opens the OTP verification screen.',
    registerFirstNameLabel: 'First Name *',
    registerFirstNamePlaceholder: 'Oleksandr',
    registerUsernameLabel: 'Nickname (username) *',
    registerUsernamePlaceholder: 's1mple_pro',
    registerPhoneLabel: 'Phone Number *',
    registerEmailLabel: 'Email *',
    registerPasswordLabel: 'Password (min. 6 characters) *',
    registerConfirmPasswordLabel: 'Confirm Password *',
    registerShowPassword: 'Show',
    registerHidePassword: 'Hide',
    registerPasswordMatch: 'Matches ✓',
    registerPasswordMismatch: 'Does not match',
    registerBirthDateLabel: 'Date of Birth *',
    registerAgreePrefix: 'I agree to the rules of',
    registerAgreeSuffix: 'and the terms of account use *',
    registerSubmittingBtn: 'Registering & requesting OTP...',
    registerSubmitBtn: 'Sign up & receive OTP code →',
    registerHasAccountPrompt: 'Already have an account?',
    registerSwitchToLoginBtn: 'Sign in',
    errFirstName: 'Please enter your first name.',
    errUsername: 'Please enter a player nickname.',
    errPhone: 'Please enter a valid phone number (at least 10 characters, e.g. +380991112233).',
    errEmail: 'Please enter a valid email address.',
    errPasswordLength: 'Password must be at least 6 characters long.',
    errPasswordMismatch: 'Password and password confirmation do not match.',
    errBirthDate: 'Please select your date of birth.',
    errAgreeRules: 'You must agree to the club rules.',

    loginAria: 'Client Sign In',
    loginBadge: 'Week 2 • Client Sign In',
    loginTitle: 'Sign In to OBSIDIAN PC CLUB',
    loginSubtitle: 'Sign in using your email or phone number and password.',
    loginIdentifierLabel: 'Email or Phone *',
    loginIdentifierPlaceholder: 'player1@gmail.com or +380993334455',
    loginPasswordLabel: 'Password *',
    loginForgotPasswordBtn: 'Forgot password?',
    loginSubmittingBtn: 'Signing in...',
    loginSubmitBtn: 'Sign in to account →',
    loginNoAccountPrompt: "Don't have an account yet?",
    loginSwitchToRegisterBtn: 'Sign up',
    errLoginIdentifier: 'Please enter your email or phone number.',
    errLoginPassword: 'Please enter your password.',

    otpAria: 'OTP Code Verification',
    otpBadge: 'Separate OTP Screen • Verification',
    otpTitle: 'Account Verification',
    otpSubtitlePrefix: 'Verification code is linked to identifier:',
    otpDevApiHeader: 'Dev API Response (POST /api/auth/otp/send)',
    otpDevApiDesc:
      'No SMS or email provider is used — the code is returned directly in the API response:',
    otpCodeChipPrefix: 'Code:',
    otpInputLabel: 'Digital Verification Code (OTP) *',
    otpVerifyingBtn: 'Verifying code & issuing token...',
    otpVerifyBtn: 'Verify code & continue with token →',
    otpResendingBtn: 'Sending...',
    otpResendBtn: 'Resend code',
    otpCancelChangeBtn: 'Cancel change',
    otpChangeTargetBtn: 'Change phone or email',
    otpNewTargetLabel: 'New phone number or email',
    otpNewTargetPlaceholder: '+380991112233 or email@domain.com',
    otpApplyTargetBtn: 'Update & send code',
    otpBackToRegisterBtn: '← Back to registration form',
    otpResentStatus: (target) => `New code generated in dev API response for ${target}.`,
    otpChangedTargetStatus: (target) =>
      `Identifier changed to ${target}. A new OTP code has been sent.`,
    errOtpCode: 'Please enter the OTP verification code.',
    errOtpNewTarget: 'Please enter a valid phone number or email.',

    resetAria: 'Password Reset',
    resetBadge: 'Account Recovery • No Email or SMS',
    resetTitle: 'Client Password Reset',
    resetSubtitle:
      'Enter email or phone → receive code in dev API response → set a new password.',
    resetTargetLabel: 'Identifier (email or phone) *',
    resetTargetPlaceholder: 'player1@gmail.com or +380993334455',
    resetResendCodeBtn: 'Resend code',
    resetGetCodeBtn: 'Get code from dev API',
    resetDevApiHeader: 'Reset code from dev API response body',
    resetCodeLabel: 'Verification code from API response *',
    resetNewPasswordLabel: 'New Password (min. 6 characters) *',
    resetConfirmPasswordLabel: 'Confirm New Password *',
    resetSavingBtn: 'Saving new password...',
    resetSubmitBtn: 'Verify code & update password ✓',
    resetBackToLoginBtn: '← Back to sign in screen',
    errResetTarget: 'Please enter the account email or phone number.',
    errResetCode: 'Please enter the password reset code from the API response.',

    cabinetAria: 'Authenticated Client Cabinet',
    cabinetBadgePrefix: 'Authenticated with JWT Token • Role:',
    cabinetWelcomePrefix: 'Welcome to OBSIDIAN PC CLUB,',
    cabinetSubtitlePrefix:
      'You are successfully signed in. Your access token is stored and attached to',
    cabinetLogoutBtn: 'Sign out',
    cabinetNicknameLabel: 'Nickname / Name',
    cabinetContactsLabel: 'Client Contacts',
    cabinetBalanceLabel: 'Gaming Balance',
    cabinetTokenLabel: 'Active JWT Access Token (used for protected API routes):',

    openApiAria: 'OpenAPI Skeleton & Client Frame',
    openApiBadge: 'Week 1 • Client Skeleton Ready',
    openApiTitle: 'Connected to OpenAPI Skeleton Stubs',
    openApiSubtitle: 'The client frontend communicates with the OpenAPI contract endpoints.',
    openApiRefreshingBtn: 'Refreshing...',
    openApiRefreshBtn: 'Refresh API requests',
    openApiSourceLabel: 'Contract Data Source',
    openApiSourceLive: 'Live NestJS OpenAPI Server',
    openApiSourceStub: 'Local OpenAPI Skeleton Stub',
    openApiUpdatedPrefix: 'Updated at',
    openApiCurrencyPrefix: 'Currency:',
    openApiGoToSplashBtn: 'Open Splash Screen',
    openApiGoToOnboardingBtn: 'Run Onboarding Again',
  },
}
