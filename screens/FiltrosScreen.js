import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { Colors } from './theme/colors'

const HAIR_COLORS = ['Ver todos', 'Loiro(a)', 'Ruivo(a)', 'Castanho', 'Preto']
const GENDERS = ['Ver todos', 'Mulher', 'Homem']

export default function FiltrosScreen({ navigation }) {
  const [hairColor, setHairColor] = useState('Ver todos')
  const [gender, setGender] = useState('Ver todos')

  const applyFilters = () => {
    navigation.navigate('Feed', { 
      filters: { hairColor, gender }
    })
  }

  const FilterButton = ({ item, selected, onPress }) => (
    <TouchableOpacity 
      style={[styles.chip, selected && styles.chipSelected]} 
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {item}
      </Text>
    </TouchableOpacity>
  )

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Filtros</Text>
      
      <Text style={styles.label}>Tom de cabelo</Text>
      <View style={styles.row}>
        {HAIR_COLORS.map(item => (
          <FilterButton 
            key={item}
            item={item}
            selected={hairColor === item}
            onPress={() => setHairColor(item)}
          />
        ))}
      </View>

      <Text style={styles.label}>Gênero</Text>
      <View style={styles.row}>
        {GENDERS.map(item => (
          <FilterButton 
            key={item}
            item={item}
            selected={gender === item}
            onPress={() => setGender(item)}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
        <Text style={styles.applyText}>Aplicar filtros</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border
  },
  chipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.text },
  chipTextSelected: { color: Colors.textInverse, fontWeight: '600' },
  applyBtn: { 
    backgroundColor: Colors.primary, 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 32 
  },
  applyText: { color: Colors.textInverse, fontSize: 16, fontWeight: '700' }
})
