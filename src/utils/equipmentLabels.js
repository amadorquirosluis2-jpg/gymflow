import { EQUIPMENT_CATEGORIES } from '../data/equipment';

const map = new Map();

for (const cat of EQUIPMENT_CATEGORIES) {
  for (const it of cat.items) {
    map.set(it.id, it.label);
  }
}

export function equipmentLabel(id) {
  return map.get(id) || id;
}
