import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useAppState } from '../store/AppState';
import { EQUIPMENT_CATEGORIES } from '../data/equipment';

export default function EquipmentAdjustScreen({ navigation }) {
  const { state, dispatch } = useAppState();
  const equipment = state.equipment || [];

  function toggle(id) {
    dispatch({ type: 'TOGGLE_EQUIPMENT', item: id });
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 16 }}
    >
      <Text style={{ fontSize: 24, fontWeight: '900' }}>Ajustar mi equipo</Text>

      {EQUIPMENT_CATEGORIES.map((cat) => (
        <View key={cat.id} style={{ gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '900' }}>{cat.label}</Text>

          <View style={{ gap: 8 }}>
            {cat.items.map((it) => {
              const active = equipment.includes(it.id);
              return (
                <Pressable
                  key={it.id}
                  onPress={() => toggle(it.id)}
                  style={{
                    padding: 12,
                    borderWidth: 1,
                    borderRadius: 12,
                    backgroundColor: active ? 'black' : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontWeight: '900',
                      color: active ? 'white' : 'black',
                    }}
                  >
                    {it.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <Pressable
        onPress={() => navigation.goBack()}
        style={{ padding: 16, borderRadius: 12, backgroundColor: 'black' }}
      >
        <Text
          style={{ color: 'white', textAlign: 'center', fontWeight: '900' }}
        >
          Listo
        </Text>
      </Pressable>
    </ScrollView>
  );
}
