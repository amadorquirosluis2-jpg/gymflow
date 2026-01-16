import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useAppState } from '../store/AppState';

export default function DayDetailScreen({ route, navigation }) {
  const { state } = useAppState();
  const { dayIndex } = route.params;

  const day = state.weeklyPlan?.[dayIndex];

  if (!day) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text>No se encontró ese día.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 12 }}
    >
      <Text style={{ fontSize: 22, fontWeight: '900' }}>{day.name}</Text>

      {day.items.map((it, idx) => (
        <View
          key={`${it.id}-${idx}`}
          style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 6 }}
        >
          <Text style={{ fontSize: 12, fontWeight: '800' }}>
            Ejercicio {idx + 1} de {day.items.length}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '900' }}>{it.name}</Text>
          <Text style={{ fontSize: 14 }}>
            {it.sets} x {it.repMin}-{it.repMax} • descanso {it.rest}s
          </Text>

          <Pressable
            onPress={() =>
              navigation.navigate('ExerciseSwap', { dayIndex, oldId: it.id })
            }
            style={{
              padding: 10,
              borderRadius: 10,
              borderWidth: 1,
              marginTop: 6,
            }}
          >
            <Text style={{ textAlign: 'center', fontWeight: '900' }}>
              Sustituir este ejercicio
            </Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
