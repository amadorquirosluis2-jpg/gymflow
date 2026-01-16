import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useAppState } from '../store/AppState';

export default function OnboardingDaysScreen({ navigation }) {
  const { state, dispatch } = useAppState();
  const [days, setDays] = useState(
    typeof state.daysPerWeek === 'number' ? state.daysPerWeek : 3
  );

  const options = useMemo(() => [1, 2, 3, 4, 5, 6, 7], []);

  function goNext() {
    dispatch({ type: 'SET_DAYS', days });
    navigation.navigate('OnboardingMinutes');
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 14 }}>
      <Text style={{ fontSize: 24, fontWeight: '900' }}>Días por semana</Text>
      <Text style={{ fontSize: 14, opacity: 0.75 }}>
        ¿Cuántos días querés entrenar?
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {options.map((n) => {
          const active = n === days;
          return (
            <Pressable
              key={n}
              onPress={() => setDays(n)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 999,
                borderWidth: 1,
                backgroundColor: active ? 'black' : 'transparent',
              }}
            >
              <Text
                style={{ fontWeight: '900', color: active ? 'white' : 'black' }}
              >
                {n} días
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1 }}
        >
          <Text style={{ textAlign: 'center', fontWeight: '900' }}>Atrás</Text>
        </Pressable>

        <Pressable
          onPress={goNext}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 12,
            backgroundColor: 'black',
          }}
        >
          <Text
            style={{ textAlign: 'center', fontWeight: '900', color: 'white' }}
          >
            Siguiente
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
