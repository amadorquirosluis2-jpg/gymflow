import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import OnboardingScreen from './src/screens/OnboardingScreen';
import OnboardingDaysScreen from './src/screens/OnboardingDaysScreen';
import OnboardingMinutesScreen from './src/screens/OnboardingMinutesScreen';
import OnboardingEquipmentScreen from './src/screens/OnboardingEquipmentScreen';

import TodayScreen from './src/screens/TodayScreen';
import WeekScreen from './src/screens/WeekScreen';
import QuickWorkoutScreen from './src/screens/QuickWorkoutScreen';
import ExerciseSwapScreen from './src/screens/ExerciseSwapScreen';
import ActiveWorkoutScreen from './src/screens/ActiveWorkoutScreen';
import ProfileScreen from './src/screens/ProfileScreen';

import { AppStateProvider } from './src/store/AppState';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tabs.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Tabs.Screen
        name="Today"
        component={TodayScreen}
        options={{ title: 'Hoy' }}
      />
      <Tabs.Screen
        name="Week"
        component={WeekScreen}
        options={{ title: 'Semana' }}
      />
      <Tabs.Screen
        name="QuickWorkout"
        component={QuickWorkoutScreen}
        options={{ title: 'Rápido' }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tabs.Navigator>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
          {/* Home con tabs */}
          <Stack.Screen
            name="Home"
            component={HomeTabs}
            options={{ headerShown: false }}
          />

          {/* Onboarding */}
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

          {/* Flows encima de tabs */}
          <Stack.Screen
            name="ExerciseSwap"
            component={ExerciseSwapScreen}
            options={{ title: 'Sustituir' }}
          />
          <Stack.Screen
            name="ActiveWorkout"
            component={ActiveWorkoutScreen}
            options={{ title: 'Entrenando' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppStateProvider>
  );
}
