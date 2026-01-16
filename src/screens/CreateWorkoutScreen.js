import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { EXERCISES } from '../data/exercises';
import { useAppState } from '../store/AppState';

function hasEquipment(exercise, userEquipment) {
  const req = exercise.equipment || [];
  if (!userEquipment || userEquipment.length === 0) return req.length === 0;
  return req.every((r) => userEquipment.includes(r));
}

const MUSCLES = [
  { id: 'full', label: 'Full body' },
  { id: 'chest', label: 'Pecho' },
  { id: 'back', label: 'Espalda' },
  { id: 'quadriceps', label: 'Pierna (cuádriceps)' },
  { id: 'hamstrings', label: 'Pierna (posterior)' },
  { id: 'glutes', label: 'Glúteos' },
  { id: 'shoulders', label: 'Hombros' },
  { id: 'biceps', label: 'Bíceps' },
  { id: 'triceps', label: 'Tríceps' },
];

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function Pill({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        backgroundColor: active ? 'black' : 'transparent',
      }}
    >
      <Text style={{ color: active ? 'white' : 'black', fontWeight: '900' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function CreateWorkoutScreen({ navigation }) {
  const { state, dispatch } = useAppState();

  const [name, setName] = useState('Mi entreno');
  const [muscles, setMuscles] = useState(['full']); // multi-select
  const [q, setQ] = useState('');

  const [selected, setSelected] = useState([]); // items con sets/reps/rest
  const [defaultSets, setDefaultSets] = useState(3);
  const [repMin, setRepMin] = useState(8);
  const [repMax, setRepMax] = useState(12);
  const [rest, setRest] = useState(90);

  const [showAddToWeek, setShowAddToWeek] = useState(false);

  function toggleMuscle(id) {
    // "full" es exclusivo
    if (id === 'full') {
      setMuscles(['full']);
      return;
    }
    const withoutFull = muscles.filter((m) => m !== 'full');
    const exists = withoutFull.includes(id);
    const next = exists
      ? withoutFull.filter((m) => m !== id)
      : [...withoutFull, id];
    setMuscles(next.length ? next : ['full']);
  }

  const available = useMemo(() => {
    const eq = state.equipment || [];

    const query = q.trim().toLowerCase();
    const isFull = muscles.includes('full');
    const allowedMains = isFull ? null : muscles;

    const base = EXERCISES.filter((e) => {
      if (!isFull && allowedMains && allowedMains.length) {
        if (!allowedMains.includes(e.main)) return false;
      }
      return true;
    });

    const filteredByEq =
      eq.length === 0
        ? base.filter((e) => (e.equipment || []).length === 0)
        : base.filter((e) => hasEquipment(e, eq));

    const filteredByQuery =
      query.length >= 2
        ? filteredByEq.filter((e) => e.name.toLowerCase().includes(query))
        : filteredByEq;

    const rank = { compound: 1, accessory: 2, isolation: 3 };
    return [...filteredByQuery].sort(
      (a, b) => (rank[a.kind] || 9) - (rank[b.kind] || 9)
    );
  }, [muscles, state.equipment, q]);

  function toggleExercise(ex) {
    const exists = selected.find((x) => x.id === ex.id);
    if (exists) {
      setSelected(selected.filter((x) => x.id !== ex.id));
      return;
    }
    setSelected([
      ...selected,
      {
        id: ex.id,
        name: ex.name,
        sets: defaultSets,
        repMin,
        repMax,
        rest,
      },
    ]);
  }

  function updateItem(id, patch) {
    setSelected(selected.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function buildWorkoutObject() {
    return {
      id: uid(),
      name: name.trim() || 'Mi entreno',
      createdAt: Date.now(),
      items: selected,
    };
  }

  function saveWorkoutOnly() {
    if (selected.length === 0) return;
    const workout = buildWorkoutObject();
    dispatch({ type: 'ADD_CUSTOM_WORKOUT', workout });
    navigation.goBack();
  }

  function startNow() {
    if (selected.length === 0) return;
    dispatch({ type: 'START_WORKOUT', dayIndex: 0, items: selected });
    navigation.navigate('ActiveWorkout');
  }

  function addToWeek(dayIndex) {
    if (selected.length === 0) return;

    const workout = buildWorkoutObject();
    dispatch({ type: 'ADD_CUSTOM_WORKOUT', workout });
    dispatch({ type: 'APPLY_CUSTOM_WORKOUT_TO_DAY', dayIndex, workout });

    setShowAddToWeek(false);
    navigation.navigate('Today');
  }

  const dayCount = state.daysPerWeek || 6;
  const dayLabels = Array.from({ length: dayCount }, (_, i) => `Día ${i + 1}`);

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 12 }}
    >
      <Text style={{ fontSize: 24, fontWeight: '900' }}>Crear entreno</Text>

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 12, fontWeight: '800' }}>Nombre</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nombre del entreno"
          style={{ borderWidth: 1, borderRadius: 12, padding: 12 }}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 12, fontWeight: '800' }}>
          Buscar ejercicio
        </Text>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Ej: press, remo, curl..."
          style={{ borderWidth: 1, borderRadius: 12, padding: 12 }}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: '800' }}>
          Zonas (podés elegir varias)
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {MUSCLES.map((m) => {
            const active = muscles.includes(m.id);
            return (
              <Pill
                key={m.id}
                label={m.label}
                active={active}
                onPress={() => toggleMuscle(m.id)}
              />
            );
          })}
        </View>
      </View>

      <View style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '900' }}>
          Defaults al agregar
        </Text>
        <Text style={{ fontSize: 12 }}>
          Sets: {defaultSets} • Reps: {repMin}-{repMax} • Descanso: {rest}s
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Pressable
            onPress={() => setDefaultSets(Math.max(1, defaultSets - 1))}
            style={{ padding: 10, borderWidth: 1, borderRadius: 10 }}
          >
            <Text style={{ fontWeight: '900' }}>- set</Text>
          </Pressable>
          <Pressable
            onPress={() => setDefaultSets(defaultSets + 1)}
            style={{ padding: 10, borderWidth: 1, borderRadius: 10 }}
          >
            <Text style={{ fontWeight: '900' }}>+ set</Text>
          </Pressable>

          <Pressable
            onPress={() => setRest(Math.max(15, rest - 15))}
            style={{ padding: 10, borderWidth: 1, borderRadius: 10 }}
          >
            <Text style={{ fontWeight: '900' }}>-15s</Text>
          </Pressable>
          <Pressable
            onPress={() => setRest(rest + 15)}
            style={{ padding: 10, borderWidth: 1, borderRadius: 10 }}
          >
            <Text style={{ fontWeight: '900' }}>+15s</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '900' }}>
          Elegí ejercicios
        </Text>

        {available.map((ex) => {
          const active = !!selected.find((x) => x.id === ex.id);
          return (
            <Pressable
              key={ex.id}
              onPress={() => toggleExercise(ex)}
              style={{
                padding: 12,
                borderWidth: 1,
                borderRadius: 12,
                backgroundColor: active ? 'black' : 'transparent',
              }}
            >
              <Text
                style={{ fontWeight: '900', color: active ? 'white' : 'black' }}
              >
                {ex.name}
              </Text>
              <Text style={{ fontSize: 12, color: active ? 'white' : 'black' }}>
                {ex.main} • {ex.kind} •{' '}
                {(ex.equipment || []).length
                  ? ex.equipment.join(', ')
                  : 'sin equipo'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 8, marginTop: 6 }}>
        <Text style={{ fontSize: 16, fontWeight: '900' }}>
          Seleccionados ({selected.length})
        </Text>

        {selected.map((it, idx) => (
          <View
            key={`${it.id}-${idx}`}
            style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 6 }}
          >
            <Text style={{ fontSize: 16, fontWeight: '900' }}>{it.name}</Text>
            <Text style={{ fontSize: 13 }}>
              {it.sets} x {it.repMin}-{it.repMax} • descanso {it.rest}s
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Pressable
                onPress={() =>
                  updateItem(it.id, { sets: Math.max(1, it.sets - 1) })
                }
                style={{ padding: 10, borderWidth: 1, borderRadius: 10 }}
              >
                <Text style={{ fontWeight: '900' }}>- set</Text>
              </Pressable>
              <Pressable
                onPress={() => updateItem(it.id, { sets: it.sets + 1 })}
                style={{ padding: 10, borderWidth: 1, borderRadius: 10 }}
              >
                <Text style={{ fontWeight: '900' }}>+ set</Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  updateItem(it.id, { rest: Math.max(15, it.rest - 15) })
                }
                style={{ padding: 10, borderWidth: 1, borderRadius: 10 }}
              >
                <Text style={{ fontWeight: '900' }}>-15s</Text>
              </Pressable>
              <Pressable
                onPress={() => updateItem(it.id, { rest: it.rest + 15 })}
                style={{ padding: 10, borderWidth: 1, borderRadius: 10 }}
              >
                <Text style={{ fontWeight: '900' }}>+15s</Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  setSelected(selected.filter((x) => x.id !== it.id))
                }
                style={{ padding: 10, borderWidth: 1, borderRadius: 10 }}
              >
                <Text style={{ fontWeight: '900' }}>Quitar</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      {/* Primary actions */}
      <Pressable
        onPress={startNow}
        style={{
          padding: 16,
          borderRadius: 12,
          backgroundColor: selected.length ? 'black' : '#aaa',
        }}
        disabled={selected.length === 0}
      >
        <Text
          style={{ color: 'white', textAlign: 'center', fontWeight: '900' }}
        >
          Entrenar ahora
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setShowAddToWeek(!showAddToWeek)}
        style={{
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          backgroundColor: 'transparent',
          opacity: selected.length ? 1 : 0.6,
        }}
        disabled={selected.length === 0}
      >
        <Text style={{ textAlign: 'center', fontWeight: '900' }}>
          Agregar a mi semana
        </Text>
      </Pressable>

      {showAddToWeek && (
        <View
          style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 10 }}
        >
          <Text style={{ fontWeight: '900' }}>
            ¿En qué día lo querés poner?
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {dayLabels.map((lbl, i) => (
              <Pressable
                key={lbl}
                onPress={() => addToWeek(i)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                }}
              >
                <Text style={{ fontWeight: '900' }}>{lbl}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Pressable
        onPress={saveWorkoutOnly}
        style={{
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          opacity: selected.length ? 1 : 0.6,
        }}
        disabled={selected.length === 0}
      >
        <Text style={{ textAlign: 'center', fontWeight: '900' }}>
          Guardar (sin agregar a la semana)
        </Text>
      </Pressable>
    </ScrollView>
  );
}
