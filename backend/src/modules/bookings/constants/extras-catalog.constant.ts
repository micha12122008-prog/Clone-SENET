export interface BookingExtraItem {
  id: string;
  name: string;
  category: 'напої' | 'снеки' | 'геймпад' | 'vr';
  price: number;
  description: string;
}

export const BOOKING_EXTRAS_CATALOG: BookingExtraItem[] = [
  {
    id: 'extra-redbull',
    name: 'Red Bull Energy Drink 0.25л',
    category: 'напої',
    price: 65.0,
    description: 'Охолоджений енергетичний напій для максимальної концентрації',
  },
  {
    id: 'extra-cola',
    name: 'Coca-Cola 0.5л',
    category: 'напої',
    price: 40.0,
    description: 'Класична прохолодна Coca-Cola',
  },
  {
    id: 'extra-monster',
    name: 'Monster Energy Mango Loco 0.5л',
    category: 'напої',
    price: 85.0,
    description: 'Енергетик з вибуховим смаком соковитого манго',
  },
  {
    id: 'extra-sandwich',
    name: 'Клаб-сендвіч із куркою та сиром чеддер',
    category: 'снеки',
    price: 120.0,
    description: 'Свіжий сендвіч на тостовому хлібі з соковитим філе',
  },
  {
    id: 'extra-chips',
    name: 'Чіпси Pringles Paprika 165г',
    category: 'снеки',
    price: 110.0,
    description: 'Хрусткі картопляні чіпси зі смаком паприки',
  },
  {
    id: 'extra-dualsense',
    name: 'Другий геймпад Sony DualSense Wireless',
    category: 'геймпад',
    price: 50.0,
    description: 'Оренда додаткового бездротового контролера для гри вдвох (PS5 / PC)',
  },
  {
    id: 'extra-vr-operator',
    name: 'Персональний VR-оператор та інструктор',
    category: 'vr',
    price: 150.0,
    description: 'Повний супровід VR-сесії, налаштування шолома та допомога в іграх',
  },
];
