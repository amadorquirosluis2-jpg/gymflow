import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { useAppState } from '../store/AppState';

const PRESETS = [30, 45, 60, 75, 90];
const MIN = 20;
const MAX = 180;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function OnboardingMinutesScreen({ navigation }) {
  const { state, dispatch } = useAppState();

  const initial =
    typeof state.sessionMinutes === 'number' ? state.sessionMinutes : 45;

  const [minutes, setMinutes] = useState(clamp(initial, MIN, MAX));
  const [input, setInput] = useState(String(clamp(initial, MIN, MAX)));

  // Si el state se hidrata luego (AsyncStorage), sincronizamos cuando cambie.
  useEffect(() => {
    const v = clamp(initial, MIN, MAX);
    setMinutes(v);
    setInput(String(v));
  }, [initial]);

  const warning = useMemo(() => {
    if (Number.isNaN(Number(minutes))) return 'Elegí un número de minutos.';
    if (Number(minutes) < MIN) return `Mínimo ${MIN} min.`;
    if (Number(minutes) > MAX) return `Máximo ${MAX} min.`;
    return '';
  }, [minutes]);

  function apply(n) {
    const v = clamp(Number(n), MIN, MAX);
    setMinutes(v);
    setInput(String(v));
    dispatch({ type: 'SET_MINUTES', minutes: v });
  }

  function onChangeText(t) {
    setInput(t);

    const cleaned = t.replace(/[^0-9]/g, '');
    if (cleaned.length === 0) {
      setMinutes(NaN);
      return;
    }

    setMinutes(Number(cleaned));
  }

  function onBlur() {
    if (!input || input.trim() === '') {
      apply(initial || 45);
      return;
    }
    apply(minutes);
  }

  function goNext() {
    const v = clamp(Number(minutes), MIN, MAX);
    dispatch({ type: 'SET_MINUTES', minutes: v });
    navigation.navigate('OnboardingEquipment');
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 14 }}
    >
      <Text style={{ fontSize: 24, fontWeight: '900' }}>Tiempo por sesión</Text>

      <Text style={{ fontSize: 15, lineHeight: 22 }}>
        Elegí cuánto tiempo querés entrenar por día. Esto ajusta la cantidad
        total de ejercicios y sets.
      </Text>

      {/* Presets */}
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: '900' }}>
          Opciones rápidas
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {PRESETS.map((p) => {
            const active =
              clamp(Number(minutes) || initial || 45, MIN, MAX) === p;
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
      </View>

      {/* Custom input */}
      <View style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '900' }}>Personalizado</Text>

        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Pressable
            onPress={() => apply((Number(minutes) || initial || 45) - 5)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderRadius: 10,
            }}
          >
            <Text style={{ fontWeight: '900' }}>-5</Text>
          </Pressable>

          <View style={{ flex: 1 }}>
            <TextInput
              value={input}
              onChangeText={onChangeText}
              onBlur={onBlur}
              keyboardType="number-pad"
              placeholder="Ej: 50"
              style={{
                borderWidth: 1,
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 12,
                fontSize: 16,
                fontWeight: '900',
              }}
            />
            <Text style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
              Rango recomendado: {MIN}–{MAX} min
            </Text>
          </View>

          <Pressable
            onPress={() => apply((Number(minutes) || initial || 45) + 5)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderRadius: 10,
            }}
          >
            <Text style={{ fontWeight: '900' }}>+5</Text>
          </Pressable>
        </View>

        {!!warning && (
          <Text style={{ fontSize: 12, color: '#b00020', fontWeight: '800' }}>
            {warning}
          </Text>
        )}
      </View>

      {/* Summary */}
      <View style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 6 }}>
        <Text style={{ fontSize: 12, fontWeight: '900' }}>Resumen</Text>
        <Text style={{ fontSize: 16, fontWeight: '900' }}>
          Tu sesión: {clamp(Number(minutes) || initial || 45, MIN, MAX)} min
        </Text>
        <Text style={{ fontSize: 12, opacity: 0.75 }}>
          Podés cambiar esto más adelante.
        </Text>
      </View>

      {/* Navigation */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
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
