import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { useAppState } from '../store/AppState';
import { EXERCISES } from '../data/exercises';

function prettifyId(id) {
  return String(id)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function hasEquipment(ex, userEq) {
  const req = ex?.equipment || [];
  if (!req.length) return true;
  return req.every((r) => userEq.includes(r));
}

export default function ExerciseSwapScreen({ navigation, route }) {
  const { state, dispatch } = useAppState();

  const dayIndexRaw = route?.params?.dayIndex;
  const dayIndex = Number.isFinite(Number(dayIndexRaw))
    ? Number(dayIndexRaw)
    : null;

  const oldId = String(route?.params?.oldId || '');

  const [q, setQ] = useState('');

  const userEq =
    state.equipmentProfile === 'none' ||
    state.equipmentProfile === 'no_equipment'
      ? []
      : Array.isArray(state.equipment)
        ? state.equipment
        : [];

  const currentDay = state.weeklyPlan?.[dayIndex];
  const oldItem = currentDay?.items?.find((x) => x.id === oldId);

  const oldMeta = useMemo(() => {
    return (EXERCISES || []).find((e) => e.id === oldId) || null;
  }, [oldId]);

  const candidates = useMemo(() => {
    const all = Array.isArray(EXERCISES) ? EXERCISES : [];
    const filteredByEquipment =
      userEq.length === 0
        ? all.filter((e) => (e.equipment || []).length === 0)
        : all.filter((e) => hasEquipment(e, userEq));

    // si sabemos el "main" del ejercicio actual, intentamos mostrar primero esa zona
    const sameMain = oldMeta?.main
      ? filteredByEquipment.filter(
          (e) => e.main === oldMeta.main && e.id !== oldId
        )
      : [];

    const rest = oldMeta?.main
      ? filteredByEquipment.filter(
          (e) => e.main !== oldMeta.main && e.id !== oldId
        )
      : filteredByEquipment.filter((e) => e.id !== oldId);

    const combined = [...sameMain, ...rest];

    const query = q.trim().toLowerCase();
    if (!query) return combined;

    return combined.filter((e) => {
      const name = (e.name || '').toLowerCase();
      const main = (e.main || '').toLowerCase();
      return name.includes(query) || main.includes(query);
    });
  }, [userEq, oldId, oldMeta?.main, q]);

  function pick(ex) {
    if (dayIndex == null || !oldId) {
      navigation.goBack();
      return;
    }

    dispatch({
      type: 'SWAP_EXERCISE',
      dayIndex,
      oldId,
      newExercise: {
        id: ex.id,
        name: ex.name,
        // opcional (no rompe nada si tu reducer lo ignora)
        main: ex.main,
        equipment: ex.equipment,
        how: ex.how,
      },
    });

    navigation.goBack();
  }

  if (dayIndex == null || oldId.length === 0) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: '900' }}>
          Faltan parámetros para sustituir el ejercicio.
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ padding: 14, borderRadius: 12, borderWidth: 1 }}
        >
          <Text style={{ textAlign: 'center', fontWeight: '900' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 12 }}
    >
      <Text style={{ fontSize: 22, fontWeight: '900' }}>Sustituir</Text>

      <View style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 6 }}>
        <Text style={{ fontSize: 12, opacity: 0.75 }}>Ejercicio actual</Text>
        <Text style={{ fontSize: 16, fontWeight: '900' }}>
          {oldItem?.name || prettifyId(oldId)}
        </Text>
      </View>

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Buscar ejercicio…"
        style={{
          borderWidth: 1,
          borderRadius: 12,
          paddingVertical: 10,
          paddingHorizontal: 12,
          fontSize: 16,
          fontWeight: '800',
        }}
      />

      <View style={{ gap: 10 }}>
        {candidates.map((ex) => (
          <Pressable
            key={ex.id}
            onPress={() => pick(ex)}
            style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 4 }}
          >
            <Text style={{ fontSize: 16, fontWeight: '900' }}>{ex.name}</Text>
            <Text style={{ fontSize: 12, opacity: 0.7 }}>
              {ex.main ? prettifyId(ex.main) : ''}
            </Text>
          </Pressable>
        ))}

        {!candidates.length && (
          <Text style={{ opacity: 0.7 }}>
            No hay candidatos con tu equipo / filtro actual.
          </Text>
        )}
      </View>

      <Pressable
        onPress={() => navigation.goBack()}
        style={{ padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 6 }}
      >
        <Text style={{ textAlign: 'center', fontWeight: '900' }}>Cancelar</Text>
      </Pressable>
    </ScrollView>
  );
}
