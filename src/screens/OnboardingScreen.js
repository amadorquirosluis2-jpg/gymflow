import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useAppState } from '../store/AppState';

const GOALS = [
  {
    id: 'hypertrophy',
    title: 'Ganar músculo',
    subtitle: '8–12 reps, descanso medio.',
  },
  { id: 'strength', title: 'Fuerza', subtitle: '4–6 reps, descanso largo.' },
  {
    id: 'fat_loss',
    title: 'Perder grasa',
    subtitle: '10–15 reps, descanso corto.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const { dispatch } = useAppState();

  function pick(goal) {
    dispatch({ type: 'SET_GOAL', goal });
    navigation.navigate('OnboardingDays');
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '900' }}>Objetivo</Text>
      <Text style={{ fontSize: 14, opacity: 0.75 }}>
        Elegí el tipo de rutina que querés.
      </Text>

      {GOALS.map((g) => (
        <Pressable
          key={g.id}
          onPress={() => pick(g.id)}
          style={{ padding: 14, borderWidth: 1, borderRadius: 14 }}
        >
          <Text style={{ fontSize: 16, fontWeight: '900' }}>{g.title}</Text>
          <Text style={{ marginTop: 4, opacity: 0.75 }}>{g.subtitle}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
