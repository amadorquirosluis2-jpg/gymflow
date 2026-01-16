import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'GYMFLOW_STATE_V3';

const initialState = {
  goal: null,
  daysPerWeek: null,
  sessionMinutes: null,

  equipmentProfile: null,
  equipment: [],

  weeklyPlan: null,

  trainingDefaults: {
    sets: 3,
    repMin: 8,
    repMax: 12,
    rest: 90,
  },

  activeWorkout: null,

  workoutHistory: [],
};

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function clampInt(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, Math.round(x)));
}

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function summarizeItems(items) {
  const arr = safeArray(items);
  return arr.map((it) => ({
    id: it.id,
    name: it.name,
    totalSets: it.totalSets ?? it.sets ?? 0,
    completedSets: it.completedSets ?? 0,
    repMin: it.repMin,
    repMax: it.repMax,
    rest: it.rest,
  }));
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_GOAL':
      return { ...state, goal: action.goal };

    case 'SET_DAYS':
      return { ...state, daysPerWeek: action.days };

    case 'SET_MINUTES':
      return { ...state, sessionMinutes: action.minutes };

    case 'SET_EQUIPMENT':
    case 'SET_EQUIPMENT_PROFILE':
      return {
        ...state,
        equipmentProfile: action.profile,
        equipment: safeArray(action.equipment),
      };

    case 'SET_WEEKLY_PLAN':
      return { ...state, weeklyPlan: action.plan };

    case 'SET_TRAINING_DEFAULTS': {
      const prev = state.trainingDefaults || initialState.trainingDefaults;
      const next = action.defaults || {};
      const repMin = clampInt(next.repMin ?? prev.repMin, 1, 100);
      const repMax = clampInt(next.repMax ?? prev.repMax, 1, 100);

      return {
        ...state,
        trainingDefaults: {
          sets: clampInt(next.sets ?? prev.sets, 1, 12),
          repMin: Math.min(repMin, repMax),
          repMax: Math.max(repMax, repMin),
          rest: clampInt(next.rest ?? prev.rest, 0, 600),
        },
      };
    }

    /* ==============================
       🔁 SWAP EXERCISE (por índice)
       ============================== */
    case 'SWAP_EXERCISE': {
      const dayIndex = Number(action.dayIndex);
      const itemIndex = Number(action.itemIndex);
      const oldId = action.oldId;

      if (!state.weeklyPlan) return state;
      if (!Number.isFinite(dayIndex)) return state;
      if (!Number.isFinite(itemIndex)) return state;
      if (!oldId) return state;
      if (!action.newExercise || !action.newExercise.id) return state;

      const weeklyPlan = safeArray(state.weeklyPlan).map((day, dIdx) => {
        if (dIdx !== dayIndex) return day;

        const items = safeArray(day.items).map((it, iIdx) => {
          if (iIdx !== itemIndex) return it;

          return {
            ...it,
            id: action.newExercise.id,
            name: action.newExercise.name || it.name,
            main: action.newExercise.main ?? it.main,
            equipment: action.newExercise.equipment ?? it.equipment,
            how: action.newExercise.how ?? it.how,
          };
        });

        return { ...day, items };
      });

      return { ...state, weeklyPlan };
    }

    /* ==============================
       🗓️ REORDER DAYS
       ============================== */
    case 'MOVE_DAY': {
      const from = Number(action.from);
      const to = Number(action.to);

      const plan = safeArray(state.weeklyPlan);
      if (!plan.length) return state;
      if (!Number.isFinite(from) || !Number.isFinite(to)) return state;
      if (from < 0 || from >= plan.length) return state;
      if (to < 0 || to >= plan.length) return state;
      if (from === to) return state;

      const next = [...plan];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);

      return { ...state, weeklyPlan: next };
    }

    /* ==============================
       🏋️ WORKOUT ACTIVE
       ============================== */
    case 'START_WORKOUT': {
      const dayIndex = action.dayIndex ?? 0;
      const items = safeArray(action.items);

      const d = state.trainingDefaults || initialState.trainingDefaults;

      return {
        ...state,
        activeWorkout: {
          id: uid(),
          dayIndex,
          startedAt: Date.now(),
          currentExerciseIndex: 0,
          restingUntil: null,
          name: action.name || 'Entreno',
          source: action.source || 'plan',
          meta: action.meta || null,
          items: items.map((it) => ({
            id: it.id,
            name: it.name,
            totalSets: Number.isFinite(it.sets) ? it.sets : d.sets,
            completedSets: 0,
            repMin: Number.isFinite(it.repMin) ? it.repMin : d.repMin,
            repMax: Number.isFinite(it.repMax) ? it.repMax : d.repMax,
            rest: Number.isFinite(it.rest) ? it.rest : d.rest,
          })),
        },
      };
    }

    case 'COMPLETE_SET': {
      if (!state.activeWorkout) return state;

      const aw = {
        ...state.activeWorkout,
        items: safeArray(state.activeWorkout.items).map((x) => ({ ...x })),
      };

      const ex = aw.items[aw.currentExerciseIndex];
      if (!ex) return state;

      if (ex.completedSets < ex.totalSets) ex.completedSets += 1;
      aw.restingUntil = Date.now() + (ex.rest || 0) * 1000;

      if (ex.completedSets >= ex.totalSets) {
        aw.currentExerciseIndex = Math.min(
          aw.currentExerciseIndex + 1,
          aw.items.length - 1
        );
      }

      return { ...state, activeWorkout: aw };
    }

    case 'SKIP_REST': {
      if (!state.activeWorkout) return state;
      return {
        ...state,
        activeWorkout: { ...state.activeWorkout, restingUntil: null },
      };
    }

    case 'END_WORKOUT': {
      if (!state.activeWorkout) return { ...state, activeWorkout: null };

      const aw = state.activeWorkout;
      const endedAt = Date.now();
      const durationSeconds = Math.max(
        0,
        Math.floor((endedAt - (aw.startedAt || endedAt)) / 1000)
      );

      const entry = {
        id: aw.id || uid(),
        startedAt: aw.startedAt || endedAt,
        endedAt,
        durationSeconds,
        name: aw.name || 'Entreno',
        source: aw.source || 'plan',
        meta: aw.meta || null,
        itemsSummary: summarizeItems(aw.items),
      };

      const prev = safeArray(state.workoutHistory);
      const nextHistory = [entry, ...prev].slice(0, 200);

      return { ...state, activeWorkout: null, workoutHistory: nextHistory };
    }

    case 'CLEAR_HISTORY':
      return { ...state, workoutHistory: [] };

    case 'RESET_ALL':
    case 'RESET':
      return { ...initialState };

    case 'HYDRATE_STATE': {
      const incoming = action.state || {};
      return {
        ...state,
        ...incoming,
        trainingDefaults:
          incoming.trainingDefaults ||
          state.trainingDefaults ||
          initialState.trainingDefaults,
        workoutHistory: safeArray(incoming.workoutHistory),
      };
    }

    default:
      return state;
  }
}

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const hydratedRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) dispatch({ type: 'HYDRATE_STATE', state: JSON.parse(raw) });
      } catch (e) {
        console.log('Hydration error:', e?.message || e);
      } finally {
        hydratedRef.current = true;
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.log('Save error:', e?.message || e);
      }
    }, 250);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [state]);

  const value = useMemo(
    () => ({ state, dispatch, hydrated }),
    [state, hydrated]
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
