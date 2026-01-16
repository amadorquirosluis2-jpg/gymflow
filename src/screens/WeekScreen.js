import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useAppState } from '../store/AppState';

export default function WeekScreen({ navigation }) {
  const { state } = useAppState();
  const plan = state.weeklyPlan || [];

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '900' }}>Mi semana</Text>

      {!plan.length ? (
        <View style={{ padding: 14, borderWidth: 1, borderRadius: 14 }}>
          <Text style={{ fontWeight: '900' }}>No hay rutina todavía.</Text>
          <Pressable
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'OnboardingGoal' }],
              })
            }
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 12,
              backgroundColor: 'black',
            }}
          >
            <Text
              style={{ color: 'white', textAlign: 'center', fontWeight: '900' }}
            >
              Crear rutina
            </Text>
          </Pressable>
        </View>
      ) : (
        plan.map((day, idx) => (
          <View
            key={idx}
            style={{ padding: 14, borderWidth: 1, borderRadius: 14, gap: 6 }}
          >
            <Text style={{ fontSize: 16, fontWeight: '900' }}>
              {idx + 1}. {day.name}
            </Text>
            <Text style={{ opacity: 0.75 }}>
              {(day.items || []).length} ejercicios
            </Text>
          </View>
        ))
      )}

      <Pressable
        onPress={() => navigation.goBack()}
        style={{ padding: 14, borderRadius: 12, borderWidth: 1 }}
      >
        <Text style={{ textAlign: 'center', fontWeight: '900' }}>Volver</Text>
      </Pressable>
    </ScrollView>
  );
}
