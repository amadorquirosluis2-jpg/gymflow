import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useAppState } from '../store/AppState';
import { buildWeeklyPlan } from '../plan/planBuilder';
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_PROFILES,
  equipmentLabel,
} from '../data/equipment';

const PROFILES = [
  {
    id: 'none',
    title: 'Casa sin equipo',
    subtitle: 'Entrenamientos solo con tu peso corporal.',
  },
  {
    id: 'home_basic',
    title: 'Casa básico',
    subtitle: 'Lo esencial para entrenar en casa.',
  },
  {
    id: 'limited_gym',
    title: 'Gym limitado',
    subtitle: 'Equipo común, no todo.',
  },
  {
    id: 'full_gym',
    title: 'Gym completo',
    subtitle: 'Acceso completo a máquinas y pesos.',
  },
];

export default function OnboardingEquipmentScreen({ navigation }) {
  const { state, dispatch } = useAppState();

  const [profile, setProfile] = useState(state.equipmentProfile || null);
  const [equipment, setEquipment] = useState(
    Array.isArray(state.equipment) ? state.equipment : []
  );
  const [expanded, setExpanded] = useState(false);

  const allIds = useMemo(
    () => EQUIPMENT_CATEGORIES.flatMap((c) => (c.items || []).map((i) => i.id)),
    []
  );

  function defaultsFor(profileId) {
    if (profileId === 'none') return [];
    const ids = EQUIPMENT_PROFILES?.[profileId] || [];
    return Array.isArray(ids) ? ids : [];
  }

  function selectProfile(profileId) {
    setProfile(profileId);
    const defaults = defaultsFor(profileId);
    setEquipment(defaults);
    setExpanded(profileId !== 'none');
  }

  function toggle(id) {
    setEquipment((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function finish() {
    const finalProfile = profile || 'none';
    const finalEquipment = finalProfile === 'none' ? [] : equipment;

    // 1. Guardar equipo
    dispatch({
      type: 'SET_EQUIPMENT_PROFILE',
      profile: finalProfile,
      equipment: finalEquipment,
    });

    // 2. Generar rutina
    const plan = buildWeeklyPlan({
      goal: state.goal,
      daysPerWeek: state.daysPerWeek,
      sessionMinutes: state.sessionMinutes,
      equipmentProfile: finalProfile,
      equipment: finalEquipment,
    });

    // 3. Guardar rutina
    dispatch({ type: 'SET_WEEKLY_PLAN', plan });

    // 4. Ir a Hoy
    navigation.reset({
      index: 0,
      routes: [{ name: 'Today' }],
    });
  }

  function Preview({ profileId, color }) {
    const ids = defaultsFor(profileId);
    if (!ids.length) return null;
    const labels = ids.map((x) => equipmentLabel(x));
    const preview = labels.slice(0, 5).join(' • ');
    const extra = labels.length > 5 ? `  +${labels.length - 5}` : '';
    return (
      <Text style={{ marginTop: 8, fontSize: 12, color, opacity: 0.9 }}>
        {preview}
        {extra}
      </Text>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '900' }}>¿Dónde entrenás?</Text>
      <Text style={{ fontSize: 14, opacity: 0.75 }}>
        Elegí el lugar. Si hay equipo, podés ajustar qué tenés disponible.
      </Text>

      {PROFILES.map((p) => {
        const active = p.id === profile;
        const dim = profile && !active;
        const bg = active ? 'black' : 'transparent';
        const fg = active ? 'white' : 'black';

        return (
          <View
            key={p.id}
            style={{
              padding: 14,
              borderWidth: 1,
              borderRadius: 14,
              opacity: dim ? 0.35 : 1,
              backgroundColor: bg,
            }}
          >
            <Pressable onPress={() => selectProfile(p.id)}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: fg }}>
                {p.title}
              </Text>
              <Text style={{ marginTop: 4, color: fg }}>{p.subtitle}</Text>
              <Preview profileId={p.id} color={fg} />
            </Pressable>

            {active && p.id !== 'none' && (
              <View style={{ marginTop: 12, gap: 10 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '900' }}>
                    Personalizá tu equipo
                  </Text>

                  <Pressable
                    onPress={() => setExpanded((x) => !x)}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: 'white',
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '900' }}>
                      {expanded ? 'Ocultar' : 'Ver'}
                    </Text>
                  </Pressable>
                </View>

                {expanded && (
                  <View style={{ gap: 12 }}>
                    {EQUIPMENT_CATEGORIES.map((cat) => (
                      <View key={cat.id} style={{ gap: 8 }}>
                        <Text style={{ color: 'white', fontWeight: '900' }}>
                          {cat.label}
                        </Text>

                        {(cat.items || []).map((item) => {
                          const selected = equipment.includes(item.id);
                          return (
                            <Pressable
                              key={item.id}
                              onPress={() => toggle(item.id)}
                              style={{
                                padding: 10,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: 'white',
                                backgroundColor: selected
                                  ? 'white'
                                  : 'transparent',
                              }}
                            >
                              <Text
                                style={{
                                  fontWeight: '800',
                                  color: selected ? 'black' : 'white',
                                }}
                              >
                                {selected ? '✓ ' : ''}
                                {item.label} {/* SIEMPRE label */}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}

      <Pressable
        onPress={finish}
        disabled={!profile}
        style={{
          padding: 16,
          borderRadius: 12,
          backgroundColor: profile ? 'black' : '#aaa',
        }}
      >
        <Text
          style={{ color: 'white', textAlign: 'center', fontWeight: '900' }}
        >
          Finalizar onboarding
        </Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.goBack()}
        style={{ padding: 14, borderRadius: 12, borderWidth: 1 }}
      >
        <Text style={{ textAlign: 'center', fontWeight: '900' }}>Atrás</Text>
      </Pressable>
    </ScrollView>
  );
}
