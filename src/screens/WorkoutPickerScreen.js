import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useAppState } from '../store/AppState';

export default function WorkoutPickerScreen({ navigation, route }) {
  const { state, dispatch } = useAppState();
  const { dayIndex = 0 } = route?.params || {};

  const list = state.customWorkouts || [];

  if (list.length === 0) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '900' }}>
          No tenés entrenos guardados aún.
        </Text>

        <Pressable
          onPress={() => navigation.navigate('CreateWorkout')}
          style={{ padding: 14, borderRadius: 12, backgroundColor: 'black' }}
        >
          <Text
            style={{ color: 'white', textAlign: 'center', fontWeight: '900' }}
          >
            Crear entreno
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.goBack()}
          style={{ padding: 14, borderRadius: 12, borderWidth: 1 }}
        >
          <Text style={{ textAlign: 'center', fontWeight: '900' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  function apply(workout) {
    dispatch({ type: 'APPLY_CUSTOM_WORKOUT_TO_DAY', dayIndex, workout });
    navigation.goBack();
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 12 }}
    >
      <Text style={{ fontSize: 22, fontWeight: '900' }}>
        Elegí entreno para Día {dayIndex + 1}
      </Text>

      {list.map((w) => (
        <Pressable
          key={w.id}
          onPress={() => apply(w)}
          style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 6 }}
        >
          <Text style={{ fontSize: 16, fontWeight: '900' }}>{w.name}</Text>
          <Text style={{ fontSize: 12 }}>
            {w.items?.length || 0} ejercicios
          </Text>
        </Pressable>
      ))}

      <Pressable
        onPress={() => navigation.goBack()}
        style={{ padding: 14, borderRadius: 12, borderWidth: 1 }}
      >
        <Text style={{ textAlign: 'center', fontWeight: '900' }}>Cancelar</Text>
      </Pressable>
    </ScrollView>
  );
}
