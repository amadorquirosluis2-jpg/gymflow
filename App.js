import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OnboardingScreen from './src/screens/OnboardingScreen';
import OnboardingDaysScreen from './src/screens/OnboardingDaysScreen';
import OnboardingMinutesScreen from './src/screens/OnboardingMinutesScreen';
import OnboardingEquipmentScreen from './src/screens/OnboardingEquipmentScreen';

import TodayScreen from './src/screens/TodayScreen';
import WeekScreen from './src/screens/WeekScreen';

// Si todavía no existen, los removemos por ahora para no romper el build:
import ExerciseSwapScreen from './src/screens/ExerciseSwapScreen';

import { AppStateProvider } from './src/store/AppState';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AppStateProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
          <Stack.Screen
            name="OnboardingGoal"
            component={OnboardingScreen}
            options={{ title: 'GymFlow' }}
          />
          <Stack.Screen
            name="OnboardingDays"
            component={OnboardingDaysScreen}
            options={{ title: 'GymFlow' }}
          />
          <Stack.Screen
            name="OnboardingMinutes"
            component={OnboardingMinutesScreen}
            options={{ title: 'GymFlow' }}
          />
          <Stack.Screen
            name="OnboardingEquipment"
            component={OnboardingEquipmentScreen}
            options={{ title: 'GymFlow' }}
          />

          <Stack.Screen
            name="Today"
            component={TodayScreen}
            options={{ title: 'Hoy' }}
          />
          <Stack.Screen
            name="Week"
            component={WeekScreen}
            options={{ title: 'Mi semana' }}
          />

          <Stack.Screen
            name="ExerciseSwap"
            component={ExerciseSwapScreen}
            options={{ title: 'Sustituir' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppStateProvider>
  );
}
