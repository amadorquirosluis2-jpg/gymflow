import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { useAppState } from '../store/AppState';
import { EXERCISES } from '../data/exercises';

function secondsLeft(ts) {
  if (!ts) return 0;
  return Math.max(0, Math.ceil((ts - Date.now()) / 1000));
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function muscleLabel(id) {
  const map = {
    full: 'Full body',
    chest: 'Pecho',
    back: 'Espalda',
    quadriceps: 'Pierna (cuádriceps)',
    hamstrings: 'Pierna (posterior)',
    glutes: 'Glúteos',
    shoulders: 'Hombros',
    biceps: 'Bíceps',
    triceps: 'Tríceps',
  };
  return map[id] || id;
}

export default function ActiveWorkoutScreen({ navigation }) {
  const { state, dispatch } = useAppState();
  const aw = state.activeWorkout;

  const [tick, setTick] = useState(0);

  // Modal instrucciones
  const [open, setOpen] = useState(false);
  const [modalExercise, setModalExercise] = useState(null);

  const exerciseById = useMemo(() => {
    const m = new Map();
    for (const ex of EXERCISES) m.set(ex.id, ex);
    return m;
  }, []);

  function openHow(exId, fallbackName) {
    const ex = exerciseById.get(exId);
    setModalExercise(
      ex || {
        id: exId,
        name: fallbackName || 'Ejercicio',
        main: 'full',
        how: null,
      }
    );
    setOpen(true);
  }

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const restLeft = useMemo(
    () => secondsLeft(aw?.restingUntil),
    [aw?.restingUntil, tick]
  );

  if (!aw) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '800' }}>
          No hay entreno activo.
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ padding: 14, borderRadius: 12, borderWidth: 1 }}
        >
          <Text style={{ textAlign: 'center', fontWeight: '800' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const ex = aw.items[aw.currentExerciseIndex];
  const meta = ex ? exerciseById.get(ex.id) : null;
  const group = meta?.main ? muscleLabel(meta.main) : null;

  const completedAll = aw.items.every((x) => x.completedSets >= x.totalSets);
  const elapsed = Math.floor((Date.now() - aw.startedAt) / 1000);

  return (
    <>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 12 }}
      >
        <Text style={{ fontSize: 24, fontWeight: '900' }}>Entrenando</Text>

        <Text style={{ fontSize: 14 }}>
          Tiempo transcurrido: {formatTime(elapsed)}
        </Text>

        {/* Progreso general */}
        <View style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 6 }}>
          <Text style={{ fontSize: 16, fontWeight: '900' }}>Progreso</Text>
          {aw.items.map((it, idx) => (
            <Text key={`${it.id}-${idx}`} style={{ fontSize: 14 }}>
              • {it.name}: {it.completedSets}/{it.totalSets}
            </Text>
          ))}
        </View>

        {/* Ejercicio actual */}
        <View style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '800' }}>
            Ejercicio {aw.currentExerciseIndex + 1} de {aw.items.length}
          </Text>

          <Text style={{ fontSize: 20, fontWeight: '900' }}>{ex?.name}</Text>

          {!!group && (
            <Text style={{ fontSize: 12, opacity: 0.75 }}>Grupo: {group}</Text>
          )}

          <Text style={{ fontSize: 14 }}>
            Set actual: {Math.min(ex.completedSets + 1, ex.totalSets)} /{' '}
            {ex.totalSets}
          </Text>

          <Text style={{ fontSize: 14 }}>
            Reps: {ex.repMin}-{ex.repMax} • Descanso: {ex.rest}s
          </Text>

          {/* Botón instrucciones */}
          <Pressable
            onPress={() => openHow(ex.id, ex.name)}
            style={{ padding: 12, borderRadius: 12, borderWidth: 1 }}
          >
            <Text style={{ textAlign: 'center', fontWeight: '900' }}>
              Instrucciones
            </Text>
          </Pressable>

          {restLeft > 0 ? (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: '900' }}>
                Descanso: {restLeft}s
              </Text>
              <Pressable
                onPress={() => dispatch({ type: 'SKIP_REST' })}
                style={{ padding: 12, borderRadius: 12, borderWidth: 1 }}
              >
                <Text style={{ textAlign: 'center', fontWeight: '900' }}>
                  Saltar descanso
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => dispatch({ type: 'COMPLETE_SET' })}
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: 'black',
              }}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontSize: 16,
                  fontWeight: '900',
                }}
              >
                Completar set
              </Text>
            </Pressable>
          )}
        </View>

        {/* Fin */}
        {completedAll && (
          <View
            style={{ padding: 12, borderWidth: 1, borderRadius: 12, gap: 10 }}
          >
            <Text style={{ fontSize: 18, fontWeight: '900' }}>
              ¡Entreno completado!
            </Text>
            <Pressable
              onPress={() => {
                dispatch({ type: 'END_WORKOUT' });
                navigation.goBack();
              }}
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: 'black',
              }}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: '900',
                }}
              >
                Finalizar
              </Text>
            </Pressable>
          </View>
        )}

        <Pressable
          onPress={() => {
            dispatch({ type: 'END_WORKOUT' });
            navigation.goBack();
          }}
          style={{ padding: 14, borderRadius: 12, borderWidth: 1 }}
        >
          <Text style={{ textAlign: 'center', fontWeight: '900' }}>
            Terminar entreno
          </Text>
        </Pressable>
      </ScrollView>

      {/* Modal Instrucciones */}
      <Modal visible={open} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.35)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              padding: 18,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              borderWidth: 1,
              gap: 10,
              maxHeight: '80%',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '900' }}>
              {modalExercise?.name || 'Instrucciones'}
            </Text>

            {!!modalExercise?.main && (
              <Text style={{ fontSize: 13, opacity: 0.7 }}>
                Grupo: {muscleLabel(modalExercise.main)}
              </Text>
            )}

            <View style={{ padding: 12, borderWidth: 1, borderRadius: 12 }}>
              <Text style={{ fontSize: 14, lineHeight: 20 }}>
                {modalExercise?.how
                  ? modalExercise.how
                  : 'Aún no hay instrucciones para este ejercicio. Podemos agregarlas en el catálogo.'}
              </Text>
            </View>

            <Pressable
              onPress={() => setOpen(false)}
              style={{
                padding: 14,
                borderRadius: 12,
                backgroundColor: 'black',
              }}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: '900',
                }}
              >
                Cerrar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
