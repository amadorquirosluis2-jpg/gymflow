import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Share } from 'react-native';
import { useAppState } from '../store/AppState';

function mins(sec) {
  return Math.round((sec || 0) / 60);
}

export default function WeekScreen({ navigation }) {
  const { state, dispatch } = useAppState();

  const plan = useMemo(
    () => (Array.isArray(state.weeklyPlan) ? state.weeklyPlan : []),
    [state.weeklyPlan]
  );

  async function shareWeek() {
    if (!plan.length) return;

    const lines = [];
    lines.push('GymFlow — Mi semana');
    lines.push('');

    plan.forEach((day, idx) => {
      lines.push(
        `Día ${idx + 1}: ${day.name || 'Entreno'} (${mins(day.totalSeconds)} min)`
      );
      (day.items || []).forEach((it) => {
        lines.push(
          `  - ${it.name}: ${it.sets} sets, ${it.repMin}-${it.repMax} reps, descanso ${it.rest}s`
        );
      });
      lines.push('');
    });

    try {
      await Share.share({ message: lines.join('\n') });
    } catch (e) {
      console.log('Share error', e?.message || e);
    }
  }

  if (!plan.length) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '900' }}>
          No hay plan semanal aún.
        </Text>
        <Pressable
          onPress={() => navigation.navigate('QuickWorkout')}
          style={{ padding: 14, borderRadius: 12, borderWidth: 1 }}
        >
          <Text style={{ textAlign: 'center', fontWeight: '900' }}>
            Entreno rápido
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 12 }}
    >
      <Text style={{ fontSize: 24, fontWeight: '900' }}>Mi semana</Text>

      <Text style={{ fontSize: 14, opacity: 0.75 }}>
        Podés reordenar los días. Este orden define “qué día toca hoy”.
      </Text>

      <Pressable
        onPress={shareWeek}
        style={{ padding: 12, borderRadius: 12, borderWidth: 1 }}
      >
        <Text style={{ textAlign: 'center', fontWeight: '900' }}>
          Compartir semana
        </Text>
      </Pressable>

      <View style={{ gap: 10 }}>
        {plan.map((day, idx) => (
          <View
            key={`${day.name}-${idx}`}
            style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 10 }}
          >
            <View style={{ gap: 4 }}>
              <Text style={{ fontWeight: '900', fontSize: 16 }}>
                Día {idx + 1}: {day.name || 'Entreno'}
              </Text>
              <Text style={{ opacity: 0.75 }}>
                {mins(day.totalSeconds)} min •{' '}
                {day.isCustom ? 'custom' : 'plan'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                disabled={idx === 0}
                onPress={() =>
                  dispatch({ type: 'MOVE_DAY', from: idx, to: idx - 1 })
                }
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  opacity: idx === 0 ? 0.4 : 1,
                }}
              >
                <Text style={{ textAlign: 'center', fontWeight: '900' }}>
                  Subir
                </Text>
              </Pressable>

              <Pressable
                disabled={idx === plan.length - 1}
                onPress={() =>
                  dispatch({ type: 'MOVE_DAY', from: idx, to: idx + 1 })
                }
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  opacity: idx === plan.length - 1 ? 0.4 : 1,
                }}
              >
                <Text style={{ textAlign: 'center', fontWeight: '900' }}>
                  Bajar
                </Text>
              </Pressable>
            </View>

            <View style={{ gap: 6 }}>
              {(day.items || []).slice(0, 6).map((it, i) => (
                <Text key={`${it.id}-${i}`} style={{ opacity: 0.85 }}>
                  • {it.name}
                </Text>
              ))}
              {(day.items || []).length > 6 && (
                <Text style={{ opacity: 0.6 }}>
                  +{(day.items || []).length - 6} más…
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
