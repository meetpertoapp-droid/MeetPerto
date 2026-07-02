import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';

const HAIR_COLORS = [
  { label: 'Ver todos', value: 'all' },
  { label: 'Loiro(a)', value: 'blonde' },
  { label: 'Ruivo(a)', value: 'red' },
  { label: 'Castanho', value: 'brown' },
  { label: 'Preto', value: 'black' }
];

const RELATIONSHIP_GOALS = [
  { label: 'Ver todos', value: 'all' },
  { label: 'Namoro sério', value: 'serious' },
  { label: 'Algo casual', value: 'casual' },
  { label: 'Amizade', value: 'friendship' }
];

export default function FiltersScreen() {
  const [ageRange, setAgeRange] = useState([18, 70]);
  const [hairColor, setHairColor] = useState('all');
  const [goal, setGoal] = useState('all');

  return (
    <View>
      <Text>Gênero: Homem, Mulher ou Ambos</Text>
      
      <Text>Idade: {ageRange[0]} a {ageRange[1]} anos</Text>
      <Slider
        minimumValue={18}
        maximumValue={70}
        step={1}
        value={ageRange}
        onValueChange={setAgeRange}
        minimumTrackTintColor="#FF2D55"
      />

      <Text>Tom de cabelo</Text>
      <Picker selectedValue={hairColor} onValueChange={setHairColor}>
        {HAIR_COLORS.map(opt => (
          <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
        ))}
      </Picker>

      <Text>Buscando</Text>
      <Picker selectedValue={goal} onValueChange={setGoal}>
        {RELATIONSHIP_GOALS.map(opt => (
          <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
        ))}
      </Picker>
    </View>
  );
}
