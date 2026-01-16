import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { useAppState } from '../store/AppState';
import { buildQuickWorkout } from '../plan/quickWorkoutBuilder';

const MAINS = [
  { id: 'chest', label: 'Pecho' },
  { id: 'back', label: 'Espalda' },
  { id: 'quadriceps', label: 'Pierna (cuádriceps)' },
  { id: 'hamstrings', label: 'Pierna (posterior)' },
  { id: 'glutes', label: 'Glúteos' },
  { id: 'shoulders', label: 'Hombros' },
  { id: 'biceps', label: 'Bíceps' },
  { id: 'triceps', label: 'Tríceps' },
  { id: 'full', label: 'Full body' },
];

const PRESETS = [20, 30, 45, 60];
const MIN = 15;
const MAX = 180;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function QuickWorkoutScreen({ navigation }) {
  const { state, dispatch } = useAppState();

  const initialMinutes =
    typeof state.sessionMinutes === 'number' ? state.sessionMinutes : 30;

  const [minutes, setMinutes] = useState(clamp(initialMinutes, MIN, MAX));
  const [input, setInput] = useState(String(clamp(initialMinutes, MIN, MAX)));
  const [selected, setSelected] = useState([]);

  const defaults = state.trainingDefaults || {
    sets: 3,
    repMin: 8,
    repMax: 12,
    rest: 90,
  };

  const canStart = useMemo(() => true, []);

  function apply(n) {
    const v = clamp(Number(n), MIN, MAX);
    setMinutes(v);
    setInput(String(v));
  }

  function onChangeText(t) {
    setInput(t);
    const cleaned = t.replace(/[^\d]/g, '');
    if (!cleaned) return;
    setMinutes(Number(cleaned));
  }

  function onBlur() {
    if (!input || input.trim() === '') {
      apply(initialMinutes || 30);
      return;
    }
    apply(minutes);
  }

  function toggleMain(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function start() {
    const mains = selected.length ? selected : ['full'];

    const dayPlan = buildQuickWorkout({
      goal: state.goal || 'hypertrophy',
      sessionMinutes: clamp(Number(minutes) || 30, MIN, MAX),
      equipmentProfile: state.equipmentProfile || 'none',
      equipment: Array.isArray(state.equipment) ? state.equipment : [],
      mains,
      defaults,
    });

    const label = mains
      .map((m) => MAINS.find((x) => x.id === m)?.label || m)
      .join(' + ');

    dispatch({
      type: 'START_WORKOUT',
      dayIndex: -1,
      items: dayPlan.items,
      name: `Entreno rápido: ${label}`,
      source: 'quick',
      meta: { mains, minutes: clamp(Number(minutes) || 30, MIN, MAX) },
    });

    navigation.getParent()?.getParent()?.navigate('ActiveWorkout') ||
      navigation.navigate('ActiveWorkout');
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 12 }}
    >
      <Text style={{ fontSize: 24, fontWeight: '900' }}>Entreno rápido</Text>

      <Text style={{ fontSize: 14, opacity: 0.75 }}>
        Elegí varios grupos musculares y cuánto tiempo tenés. Se arma una sesión
        con varios ejercicios acorde a tu equipo y a tus defaults (sets/reps).
      </Text>

      <View style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '900' }}>
          ¿Cuántos minutos tenés hoy?
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {PRESETS.map((p) => {
            const active = Number(minutes) === p;
            return (
              <Pressable
                key={p}
                onPress={() => apply(p)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  backgroundColor: active ? 'black' : 'transparent',
                }}
              >
                <Text
                  style={{
                    color: active ? 'white' : 'black',
                    fontWeight: '900',
                  }}
                >
                  {p} min
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          value={input}
          onChangeText={onChangeText}
          onBlur={onBlur}
          keyboardType="number-pad"
          placeholder="Ej: 35"
          style={{
            borderWidth: 1,
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 12,
            fontSize: 16,
            fontWeight: '900',
          }}
        />

        <Text style={{ fontSize: 12, opacity: 0.7 }}>
          Rango: {MIN}–{MAX} min
        </Text>
      </View>

      <View style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 6 }}>
        <Text style={{ fontWeight: '900' }}>Tus defaults</Text>
        <Text style={{ opacity: 0.75 }}>
          {defaults.sets} sets • {defaults.repMin}-{defaults.repMax} reps •
          descanso {defaults.rest}s
        </Text>
        <Pressable
          onPress={() => navigation.navigate('Profile')}
          style={{ padding: 12, borderRadius: 12, borderWidth: 1 }}
        >
          <Text style={{ textAlign: 'center', fontWeight: '900' }}>
            Ajustar defaults
          </Text>
        </Pressable>
      </View>

      <Text style={{ fontSize: 12, fontWeight: '900' }}>
        ¿Qué querés entrenar? (podés elegir varios)
      </Text>

      <View style={{ gap: 10 }}>
        {MAINS.map((m) => {
          const active = selected.includes(m.id);
          return (
            <Pressable
              key={m.id}
              disabled={!canStart}
              onPress={() => toggleMain(m.id)}
              style={{
                padding: 14,
                borderRadius: 12,
                borderWidth: 1,
                backgroundColor: active ? 'black' : 'transparent',
                opacity: canStart ? 1 : 0.4,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '900',
                  color: active ? 'white' : 'black',
                }}
              >
                {active ? '✓ ' : ''}
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={start}
        style={{ padding: 16, borderRadius: 12, backgroundColor: 'black' }}
      >
        <Text
          style={{ color: 'white', textAlign: 'center', fontWeight: '900' }}
        >
          Generar y entrenar ahora (~{clamp(Number(minutes) || 30, MIN, MAX)}{' '}
          min)
        </Text>
      </Pressable>
    </ScrollView>
  );
}
