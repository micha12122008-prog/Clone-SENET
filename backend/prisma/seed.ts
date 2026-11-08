import {
  PrismaClient,
  UserRole,
  PlaceStatus,
  PaymentMethod,
  OrderStatus,
  TournamentStatus,
  DeviceType,
  TariffType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Obsidian PC CLUB...');

  // 1. Очищення даних у безпечному порядку
  await prisma.review.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.match.deleteMany();
  await prisma.tournamentApplication.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.balanceLedger.deleteMany();
  await prisma.session.deleteMany();
  await prisma.bookingExtra.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.repair.deleteMany();
  await prisma.place.deleteMany();
  await prisma.tariff.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clubSettings.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // 2. Налаштування клубу
  await prisma.clubSettings.create({
    data: {
      clubName: 'Obsidian PC CLUB Kyiv',
      address: 'м. Київ, вул. Вадима Гетьмана, 1-Б',
      workingHours: '24/7',
    },
  });

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 3. Користувачі (UserRole: ADMIN, CLIENT)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@obsidianclub.ua',
      phone: '+380992223344',
      username: 'admin_alex',
      passwordHash: defaultPasswordHash,
      firstName: 'Олексій',
      lastName: 'Адмін',
      role: UserRole.ADMIN,
      balance: 500.0,
      avatarFrame: 'frame_cyber_admin',
    },
  });

  const player1 = await prisma.user.create({
    data: {
      email: 'player1@gmail.com',
      phone: '+380993334455',
      username: 's1mple_pro',
      passwordHash: defaultPasswordHash,
      firstName: 'Олександр',
      lastName: 'Костилєв',
      birthDate: new Date('1997-10-02'),
      role: UserRole.CLIENT,
      balance: 450.0,
      bonusBalance: 80.0,
      avatarFrame: 'frame_pro_sniper',
      totalPlayTimeMinutes: 1240,
      totalSpent: 1650.0,
    },
  });

  const player2 = await prisma.user.create({
    data: {
      email: 'player2@gmail.com',
      phone: '+380994445566',
      username: 'b1t_clutch',
      passwordHash: defaultPasswordHash,
      firstName: 'Валерій',
      lastName: 'Ваховський',
      birthDate: new Date('2003-01-05'),
      role: UserRole.CLIENT,
      balance: 180.0,
      bonusBalance: 20.0,
      avatarFrame: 'frame_headshot_king',
      totalPlayTimeMinutes: 520,
      totalSpent: 450.0,
    },
  });
  console.log('✅ Created Users: Admin & 2 Players');

  // 4. Зони
  const zoneStandard = await prisma.zone.create({
    data: {
      name: 'Standard Zone',
      description: 'Збалансовані ігрові ПК для рейтингового геймінгу в CS2, Dota 2, Valorant',
      deviceType: DeviceType.PC,
      baseHourlyRate: 60.0,
      colorHex: '#3B82F6',
    },
  });

  const zoneVip = await prisma.zone.create({
    data: {
      name: 'VIP OLED 240Hz',
      description: 'RTX 4090, 240Hz OLED дисплеї, анатомічні крісла, шумоізоляція',
      deviceType: DeviceType.PC,
      baseHourlyRate: 110.0,
      colorHex: '#8B5CF6',
    },
  });

  const zonePs = await prisma.zone.create({
    data: {
      name: 'PlayStation 5 Lounge',
      description: 'Sony PlayStation 5, 4K TV 65", дивани, DualSense геймпади, FIFA 24 / UFC',
      deviceType: DeviceType.PS,
      baseHourlyRate: 80.0,
      colorHex: '#F59E0B',
    },
  });
  console.log('✅ Created Zones');

  // 5. Місця
  const place1 = await prisma.place.create({
    data: {
      number: 1,
      name: 'PC-01',
      zoneId: zoneStandard.id,
      status: PlaceStatus.FREE,
      coordinateX: 100,
      coordinateY: 100,
      row: 1,
      col: 1,
      specs: { cpu: 'i5-13400F', gpu: 'RTX 4060 Ti', ram: '16GB' },
    },
  });

  const place2 = await prisma.place.create({
    data: {
      number: 2,
      name: 'VIP-01',
      zoneId: zoneVip.id,
      status: PlaceStatus.FREE,
      coordinateX: 400,
      coordinateY: 100,
      row: 1,
      col: 2,
      specs: { cpu: 'i9-14900KF', gpu: 'RTX 4090 24GB', ram: '32GB' },
    },
  });

  const place3 = await prisma.place.create({
    data: {
      number: 3,
      name: 'PC-03',
      zoneId: zoneStandard.id,
      status: PlaceStatus.MAINTENANCE,
      coordinateX: 180,
      coordinateY: 100,
      row: 1,
      col: 3,
      specs: { cpu: 'i5-13400F', gpu: 'RTX 4060 Ti', ram: '16GB' },
    },
  });
  console.log('✅ Created Places');

  // 6. Ремонти
  await prisma.repair.create({
    data: {
      placeId: place3.id,
      description: 'Заміна клавіатури Logitech G Pro',
      startedAt: new Date(),
    },
  });

  // 7. Тарифи
  const tariffStandard = await prisma.tariff.create({
    data: {
      name: '1 Година Standard',
      type: TariffType.HOURLY,
      zoneId: zoneStandard.id,
      price: 60.0,
      durationMinutes: 60,
      description: 'Погодинний тариф Standard',
    },
  });

  const tariffVip = await prisma.tariff.create({
    data: {
      name: '1 Година VIP',
      type: TariffType.HOURLY,
      zoneId: zoneVip.id,
      price: 110.0,
      durationMinutes: 60,
      description: 'Преміальний ігровий досвід',
    },
  });

  const tariff3Plus1 = await prisma.tariff.create({
    data: {
      name: 'Пакет 3+1 (4 години)',
      type: TariffType.PACKAGE_3_PLUS_1,
      zoneId: zoneStandard.id,
      price: 180.0,
      durationMinutes: 240,
      description: 'Купуй 3 години, 4-та в подарунок',
    },
  });
  console.log('✅ Created Tariffs');

  // 8. Бронювання та допи
  const booking = await prisma.booking.create({
    data: {
      userId: player1.id,
      placeId: place2.id,
      tariffId: tariffVip.id,
      startTime: new Date(Date.now() + 3600 * 1000 * 2),
      endTime: new Date(Date.now() + 3600 * 1000 * 5),
      prepaidAmount: 220.0,
      isPaidOnline: true,
      qrCode: 'QR_BOOKING_OBSIDIAN_VIP_01_TEST',
    },
  });

  await prisma.bookingExtra.create({
    data: {
      bookingId: booking.id,
      name: 'Оренда бездротових навушників HyperX Cloud Alpha',
      price: 50.0,
      quantity: 1,
    },
  });
  console.log('✅ Created Booking with Extras');

  // 9. Меню
  const menuCola = await prisma.menuItem.create({
    data: {
      name: 'Coca-Cola 0.5л',
      category: 'Напої',
      price: 40.0,
      isAvailable: true,
    },
  });

  const menuBurger = await prisma.menuItem.create({
    data: {
      name: 'Клаб-сендвіч із куркою',
      category: 'Снеки',
      price: 120.0,
      isAvailable: true,
    },
  });

  // 10. Замовлення та позиції
  const order = await prisma.order.create({
    data: {
      userId: player1.id,
      status: OrderStatus.new,
      totalAmount: 160.0,
      paymentType: PaymentMethod.BALANCE,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      menuItemId: menuCola.id,
      quantity: 1,
      unitPrice: 40.0,
      subtotal: 40.0,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      menuItemId: menuBurger.id,
      quantity: 1,
      unitPrice: 120.0,
      subtotal: 120.0,
    },
  });
  console.log('✅ Created Menu & Order with Items');

  // 11. Журнал балансу та платежі
  await prisma.balanceLedger.create({
    data: {
      userId: player1.id,
      amount: 500.0,
      balanceBefore: 0.0,
      balanceAfter: 500.0,
      description: 'Поповнення балансу через касу',
      isCashAdmin: true,
    },
  });

  await prisma.payment.create({
    data: {
      userId: player1.id,
      amount: 500.0,
      method: PaymentMethod.CASH,
    },
  });

  // 12. Турніри, матчі та заявки
  const tournament = await prisma.tournament.create({
    data: {
      title: 'Obsidian CS2 Autumn Masters 5v5',
      game: 'CS2',
      format: 'TEAM_5X5',
      status: TournamentStatus.REGISTRATION,
      prizePool: 25000.0,
      entryFee: 500.0,
      maxSlots: 16,
      startTime: new Date(Date.now() + 3600 * 1000 * 48),
      streamUrl: 'https://twitch.tv/obsidian_pc_club',
    },
  });

  await prisma.tournamentApplication.create({
    data: {
      tournamentId: tournament.id,
      userId: player1.id,
      teamName: 'Natus Vincere Academy',
      teamMembers: ['s1mple_pro', 'b1t_clutch', 'blade', 'jl', 'im'],
    },
  });

  await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      orderIndex: 1,
      participant1: 'Natus Vincere Academy',
      participant2: 'Monte Gen',
      score1: 0,
      score2: 0,
    },
  });
  console.log('✅ Created Tournament, Application and Match');

  // 13. Досягнення (4 базових відповідно до ТЗ)
  const ach1 = await prisma.achievement.create({
    data: {
      code: 'FIRST_BLOOD',
      title: 'Перша кров',
      description: 'Зіграти першу сесію в клубі Obsidian',
    },
  });

  const ach2 = await prisma.achievement.create({
    data: {
      code: 'NIGHT_OWL',
      title: 'Нічний мисливець',
      description: 'Відіграти повний нічний пакет (з 22:00 до 08:00)',
    },
  });

  await prisma.achievement.create({
    data: {
      code: 'TOURNAMENT_FIGHTER',
      title: 'Гладіатор',
      description: 'Взяти участь у кіберспортивному турнірі клубу',
    },
  });

  await prisma.achievement.create({
    data: {
      code: 'BAR_GOURMET',
      title: 'Гурман клубу',
      description: 'Зробити перше замовлення напоїв чи снеків у барі',
    },
  });

  await prisma.userAchievement.create({
    data: {
      userId: player1.id,
      achievementId: ach1.id,
    },
  });
  console.log('✅ Created 4 Achievements & linked to player1');

  // 14. Сповіщення
  await prisma.notification.create({
    data: {
      userId: player1.id,
      title: 'Ласкаво просимо до Obsidian!',
      message: 'Вам нараховано 80 бонусних балів на перший візит.',
      isRead: false,
    },
  });
  console.log('✅ Created Notification');

  console.log('\n🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
