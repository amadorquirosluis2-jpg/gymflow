import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useAppState } from '../store/AppState';
import { EXERCISES } from '../data/exercises';

function goalLabel(goal) {
  if (goal === 'hypertrophy') return 'Ganar músculo';
  if (goal === 'strength') return 'Fuerza';
  if (goal === 'fat_loss') return 'Perder grasa';
  return 'No definido';
}

function mins(sec) {
  return Math.round((sec || 0) / 60);
}

// Lunes=0..Domingo=6 (pero Date.getDay: Domingo=0)
function getTodayIndex(planLength) {
  const jsDay = new Date().getDay(); // 0 domingo .. 6 sábado
  const monday0 = (jsDay + 6) % 7;
  if (!planLength) return 0;
  return monday0 % planLength;
}

function muscleLabel(id) {
  const map = {
    full: 'Full body',
    chest: 'Pecho',
    back: 'Espalda',
    quadriceps: 'Pierna (cuádriceps)',
    hamstrings: 'Pierna (posterior)',
    glutes: 'Glúteos',
    shoulders: 'Hombros',
    biceps: 'Bíceps',
    triceps: 'Tríceps',
  };
  return map[id] || id;
}

export default function TodayScreen({ navigation }) {
  const { state, dispatch } = useAppState();

  const plan = state.weeklyPlan;
  const todayIndex = getTodayIndex(plan?.length || 0);
  const today = plan?.[todayIndex];

  const exerciseById = useMemo(() => {
    const m = new Map();
    for (const ex of EXERCISES || []) m.set(ex.id, ex);
    return m;
  }, []);

  if (!plan || !today) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '900' }}>
          No hay rutina creada aún.
        </Text>

        <Pressable
          onPress={() =>
            navigation.reset({ index: 0, routes: [{ name: 'OnboardingGoal' }] })
          }
          style={{ padding: 14, borderRadius: 10, backgroundColor: 'black' }}
        >
          <Text
            style={{ color: 'white', textAlign: 'center', fontWeight: '900' }}
          >
            Crear rutina
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '900' }}>Hoy</Text>

      <Text style={{ fontSize: 16, lineHeight: 22 }}>
        Rutina para: {goalLabel(state.goal)} • {state.daysPerWeek} días •{' '}
        {state.sessionMinutes} min
      </Text>

      <View style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: '900' }}>
          {today.name} {today.isCustom ? '(personalizado)' : ''}
        </Text>
        <Text style={{ fontSize: 14 }}>
          Tiempo estimado: {mins(today.totalSeconds)} min
        </Text>

        <View style={{ gap: 10, marginTop: 8 }}>
          {today.items.map((it, idx) => {
            const meta = exerciseById.get(it.id);
            const group = meta?.main ? muscleLabel(meta.main) : null;

            return (
              <View
                key={`${it.id}-${idx}`}
                style={{
                  padding: 10,
                  borderWidth: 1,
                  borderRadius: 10,
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '900' }}>
                  {it.name}
                </Text>

                {!!group && (
                  <Text style={{ fontSize: 12, opacity: 0.75 }}>
                    Grupo: {group}
                  </Text>
                )}

                <Text style={{ fontSize: 14 }}>
                  {it.sets} x {it.repMin}-{it.repMax} • descanso {it.rest}s
                </Text>

                <Pressable
                  onPress={() =>
                    navigation.navigate('ExerciseSwap', {
                      dayIndex: todayIndex,
                      oldId: it.id,
                    })
                  }
                  style={{ padding: 10, borderRadius: 10, borderWidth: 1 }}
                >
                  <Text style={{ textAlign: 'center', fontWeight: '900' }}>
                    Sustituir
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={() => navigation.navigate('Week')}
        style={{ padding: 14, borderRadius: 10, borderWidth: 1 }}
      >
        <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '900' }}>
          Mi semana
        </Text>
      </Pressable>

      <Pressable
        onPress={() => {
          dispatch({ type: 'RESET_ALL' });
          navigation.reset({ index: 0, routes: [{ name: 'OnboardingGoal' }] });
        }}
        style={{ padding: 14, borderRadius: 10, borderWidth: 1 }}
      >
        <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '900' }}>
          Reiniciar onboarding
        </Text>
      </Pressable>
    </ScrollView>
  );
}
