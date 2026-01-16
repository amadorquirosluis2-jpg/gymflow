import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'GYMFLOW_STATE_V2';

const initialState = {
  goal: null,
  daysPerWeek: null,
  sessionMinutes: null,

  equipmentProfile: null,
  equipment: [],

  weeklyPlan: null,
  activeWorkout: null,
};

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_GOAL':
      return { ...state, goal: action.goal };

    case 'SET_DAYS':
      return { ...state, daysPerWeek: action.days };

    case 'SET_MINUTES':
      return { ...state, sessionMinutes: action.minutes };

    // ✅ nombre nuevo
    case 'SET_EQUIPMENT':
      return {
        ...state,
        equipmentProfile: action.profile,
        equipment: safeArray(action.equipment),
      };

    // ✅ compat: nombre viejo que vos usaste antes
    case 'SET_EQUIPMENT_PROFILE':
      return {
        ...state,
        equipmentProfile: action.profile,
        equipment: safeArray(action.equipment),
      };

    case 'SET_WEEKLY_PLAN':
      return { ...state, weeklyPlan: action.plan };

    /* ==============================
       🔁 SWAP EXERCISE (CLAVE)
       ============================== */
    case 'SWAP_EXERCISE': {
      const dayIndex = Number(action.dayIndex);
      const oldId = action.oldId;

      if (!state.weeklyPlan) return state;
      if (!Number.isFinite(dayIndex)) return state;
      if (!oldId) return state;
      if (!action.newExercise || !action.newExercise.id) return state;

      const weeklyPlan = state.weeklyPlan.map((day, idx) => {
        if (idx !== dayIndex) return day;

        const items = safeArray(day.items).map((it) => {
          if (it.id !== oldId) return it;

          // Mantener sets/reps/rest del item actual
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

    /* ============================== */

    // ✅ compat con ambos nombres
    case 'RESET_ALL':
    case 'RESET':
      return { ...initialState };

    case 'HYDRATE_STATE': {
      const incoming = action.state || {};
      return { ...state, ...incoming };
    }

    default:
      return state;
  }
}

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const hydratedRef = useRef(false);
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

  const value = useMemo(() => ({ state, dispatch }), [state]);

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
