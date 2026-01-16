// src/data/equipment.js
// Data-only module: DO NOT put React components here.

export const EQUIPMENT_CATEGORIES = [
  {
    id: 'bodyweight',
    label: 'Peso corporal',
    items: [
      { id: 'bodyweight', label: 'Peso corporal' },
      { id: 'mat', label: 'Mat / colchoneta' },
      { id: 'pullup_bar', label: 'Barra de dominadas' },
      { id: 'bands', label: 'Bandas elásticas' },
      { id: 'trx', label: 'Suspensión (TRX)' },
    ],
  },
  {
    id: 'home',
    label: 'Casa',
    items: [
      { id: 'dumbbells_fixed', label: 'Mancuernas fijas' },
      { id: 'dumbbells_adjustable', label: 'Mancuernas ajustables' },
      { id: 'kettlebell', label: 'Kettlebell' },
      { id: 'bench_flat', label: 'Banca plana' },
      { id: 'bench_adjustable', label: 'Banca ajustable' },
    ],
  },
  {
    id: 'gym_basic',
    label: 'Gym básico',
    items: [
      { id: 'barbell', label: 'Barra olímpica' },
      { id: 'rack', label: 'Rack / Power rack' },
      { id: 'smith', label: 'Smith machine' },
      { id: 'cable', label: 'Poleas' },
      { id: 'lat_pulldown', label: 'Jalón al pecho' },
    ],
  },
  {
    id: 'machines',
    label: 'Máquinas',
    items: [
      { id: 'leg_press', label: 'Prensa' },
      { id: 'hack_squat', label: 'Hack squat' },
      { id: 'leg_extension', label: 'Extensión de pierna' },
      { id: 'leg_curl', label: 'Curl femoral' },
      { id: 'calf_raise', label: 'Pantorrillas' },
      { id: 'chest_press', label: 'Chest press' },
      { id: 'shoulder_press', label: 'Shoulder press' },
      { id: 'pec_deck', label: 'Pec deck' },
    ],
  },
];

export const EQUIPMENT_PROFILES = {
  none: ['bodyweight', 'mat'],
  home_basic: [
    'bodyweight',
    'mat',
    'dumbbells_adjustable',
    'bench_flat',
    'bands',
  ],
  limited_gym: [
    'bodyweight',
    'mat',
    'dumbbells_adjustable',
    'bench_flat',
    'barbell',
    'rack',
    'cable',
    'lat_pulldown',
    'leg_press',
    'smith',
  ],
  full_gym: EQUIPMENT_CATEGORIES.flatMap((c) => c.items.map((i) => i.id)),
};

// id -> label
export const EQUIPMENT_LABELS = EQUIPMENT_CATEGORIES.reduce((acc, cat) => {
  for (const it of cat.items) acc[it.id] = it.label;
  return acc;
}, {});

export function equipmentLabel(id) {
  return EQUIPMENT_LABELS[id] || id;
}
