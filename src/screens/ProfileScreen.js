import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { useAppState } from '../store/AppState';
import { buildWeeklyPlan } from '../plan/planBuilder';

function clampInt(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, Math.round(x)));
}

function formatDuration(sec) {
  const m = Math.floor((sec || 0) / 60);
  const s = (sec || 0) % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ProfileScreen({ navigation }) {
  const { state, dispatch } = useAppState();

  const td = state.trainingDefaults || {
    sets: 3,
    repMin: 8,
    repMax: 12,
    rest: 90,
  };

  const [sets, setSets] = useState(String(td.sets));
  const [repMin, setRepMin] = useState(String(td.repMin));
  const [repMax, setRepMax] = useState(String(td.repMax));
  const [rest, setRest] = useState(String(td.rest));

  const history = useMemo(
    () => (Array.isArray(state.workoutHistory) ? state.workoutHistory : []),
    [state.workoutHistory]
  );

  function saveDefaults() {
    dispatch({
      type: 'SET_TRAINING_DEFAULTS',
      defaults: {
        sets: clampInt(sets, 1, 12),
        repMin: clampInt(repMin, 1, 100),
        repMax: clampInt(repMax, 1, 100),
        rest: clampInt(rest, 0, 600),
      },
    });
  }

  function regeneratePlan() {
    const plan = buildWeeklyPlan({
      goal: state.goal || 'hypertrophy',
      daysPerWeek: state.daysPerWeek || 3,
      sessionMinutes: state.sessionMinutes || 45,
      equipmentProfile: state.equipmentProfile || 'none',
      equipment: Array.isArray(state.equipment) ? state.equipment : [],
      trainingDefaults: state.trainingDefaults,
    });

    dispatch({ type: 'SET_WEEKLY_PLAN', plan });
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 12 }}
    >
      <Text style={{ fontSize: 24, fontWeight: '900' }}>Perfil</Text>

      <View style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 10 }}>
        <Text style={{ fontWeight: '900' }}>Defaults (aplican a todo)</Text>

        <View style={{ gap: 8 }}>
          <Text style={{ fontWeight: '900' }}>Sets</Text>
          <TextInput
            value={sets}
            onChangeText={setSets}
            keyboardType="number-pad"
            style={{
              borderWidth: 1,
              borderRadius: 10,
              padding: 10,
              fontWeight: '900',
            }}
          />

          <Text style={{ fontWeight: '900' }}>Reps mín</Text>
          <TextInput
            value={repMin}
            onChangeText={setRepMin}
            keyboardType="number-pad"
            style={{
              borderWidth: 1,
              borderRadius: 10,
              padding: 10,
              fontWeight: '900',
            }}
          />

          <Text style={{ fontWeight: '900' }}>Reps máx</Text>
          <TextInput
            value={repMax}
            onChangeText={setRepMax}
            keyboardType="number-pad"
            style={{
              borderWidth: 1,
              borderRadius: 10,
              padding: 10,
              fontWeight: '900',
            }}
          />

          <Text style={{ fontWeight: '900' }}>Descanso (seg)</Text>
          <TextInput
            value={rest}
            onChangeText={setRest}
            keyboardType="number-pad"
            style={{
              borderWidth: 1,
              borderRadius: 10,
              padding: 10,
              fontWeight: '900',
            }}
          />
        </View>

        <Pressable
          onPress={saveDefaults}
          style={{ padding: 14, borderRadius: 12, backgroundColor: 'black' }}
        >
          <Text
            style={{ color: 'white', textAlign: 'center', fontWeight: '900' }}
          >
            Guardar defaults
          </Text>
        </Pressable>

        <Pressable
          onPress={regeneratePlan}
          style={{ padding: 14, borderRadius: 12, borderWidth: 1 }}
        >
          <Text style={{ textAlign: 'center', fontWeight: '900' }}>
            Regenerar plan semanal con defaults
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            navigation.getParent()?.getParent()?.navigate('OnboardingGoal') ||
            navigation.navigate('OnboardingGoal')
          }
          style={{ padding: 14, borderRadius: 12, borderWidth: 1 }}
        >
          <Text style={{ textAlign: 'center', fontWeight: '900' }}>
            Rehacer onboarding (objetivo/días/min/equipo)
          </Text>
        </Pressable>
      </View>

      <View style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 10 }}>
        <Text style={{ fontWeight: '900' }}>Historial</Text>

        {!history.length && (
          <Text style={{ opacity: 0.75 }}>Aún no hay entrenos guardados.</Text>
        )}

        {!!history.length && (
          <View style={{ gap: 10 }}>
            {history.slice(0, 20).map((h) => (
              <View
                key={h.id}
                style={{
                  padding: 10,
                  borderWidth: 1,
                  borderRadius: 10,
                  gap: 4,
                }}
              >
                <Text style={{ fontWeight: '900' }}>{h.name}</Text>
                <Text style={{ opacity: 0.75 }}>
                  {new Date(h.endedAt).toLocaleString()} •{' '}
                  {formatDuration(h.durationSeconds)} • {h.source}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Pressable
          onPress={() => dispatch({ type: 'CLEAR_HISTORY' })}
          style={{ padding: 14, borderRadius: 12, borderWidth: 1 }}
        >
          <Text style={{ textAlign: 'center', fontWeight: '900' }}>
            Borrar historial
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
