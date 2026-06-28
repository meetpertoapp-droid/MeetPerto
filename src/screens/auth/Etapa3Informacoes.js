
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Etapa3Informacoes({ route, navigation }) {
  const { metodo, valor, senha, verificado } = route.params;
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState(new Date(2000, 0, 1));
  const [mostrarData, setMostrarData] = useState(false);
  const [genero, setGenero] = useState('');
  const [cidade, setCidade] = useState('');
  const [loading, setLoading] = useState(false);

  const calcularIdade = (data) => {
    const hoje = new Date();
    const nascimento = new Date(data);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const formatarData = (data) => {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const handleContinuar = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'Digite seu nome');
      return;
    }

    if (nome.trim().length < 2) {
      Alert.alert('Erro', 'Nome muito curto');
      return;
    }

    const idade = calcularIdade(dataNascimento);
    if (idade < 18) {
      Alert.alert('Idade inválida', 'Você precisa ter 18 anos ou mais');
      return;
    }

    if (!genero) {
      Alert.alert('Erro', 'Selecione seu gênero');
      return;
    }

    if (!cidade.trim()) {
      Alert.alert('Erro', 'Digite sua cidade');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('Etapa4Fotos', {
        metodo,
        valor,
        senha,
        verificado,
        nome: nome.trim(),
        dataNascimento: dataNascimento.toISOString(),
        idade,
        genero,
        cidade: cidade.trim()
      });
    }, 500);
  };

  const onChangeData = (event, selectedDate) => {
    setMostrarData(false);
    if (selectedDate) {
      setDataNascimento(selectedDate);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.voltar}>
            <Text style={styles.voltarTexto}>← Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.logo}>MeetPerto 💕</Text>
          <Text style={styles.titulo}>Quase lá!</Text>
          <Text style={styles.subtitulo}>Conte um pouco sobre você</Text>

          <Text style={styles.label}>Como você se chama?</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu primeiro nome"
            placeholderTextColor="#999"
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
            maxLength={30}
          />

          <Text style={styles.label}>Data de nascimento</Text>
          <TouchableOpacity 
            style={styles.inputData}
            onPress={() => setMostrarData(true)}
          >
            <Text style={styles.inputDataTexto}>
              {formatarData(dataNascimento)}
            </Text>
            <Text style={styles.idadeTexto}>{calcularIdade(dataNascimento)} anos</Text>
          </TouchableOpacity>

          {mostrarData && (
            <DateTimePicker
              value={dataNascimento}
              mode="date"
              display="spinner"
              onChange={onChangeData}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
            />
          )}

          <Text style={styles.label}>Gênero</Text>
          <View style={styles.generoContainer}>
            {['Homem', 'Mulher', 'Outro'].map((opcao) => (
              <TouchableOpacity
                key={opcao}
                style={[styles.generoBtn, genero === opcao && styles.generoAtivo]}
                onPress={() => setGenero(opcao)}
              >
                <Text style={[styles.generoTexto, genero === opcao && styles.generoTextoAtivo]}>
                  {opcao}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Cidade</Text>
          <TextInput
            style={styles.input}
            placeholder="São Paulo, SP"
            placeholderTextColor="#999"
            value={cidade}
            onChangeText={setCidade}
            autoCapitalize="words"
            maxLength={50}
          />

          <TouchableOpacity
            style={[styles.botao, loading && styles.botaoDesabilitado]}
            onPress={handleContinuar}
            disabled={loading}
          >
            <Text style={styles.botaoTexto}>
              {loading ? 'Salvando...' : 'Continuar'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  voltar: {
    marginBottom: 20,
  },
  voltarTexto: {
    fontSize: 16,
    color: '#FF4B8B',
    fontWeight: '600',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FF4B8B',
    marginBottom: 8,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  inputData: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputDataTexto: {
    fontSize: 16,
    color: '#333',
  },
  idadeTexto: {
    fontSize: 14,
    color: '#FF4B8B',
    fontWeight: '600',
  },
  generoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  generoBtn: {
    flex: 1,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    alignItems: 'center',
  },
  generoAtivo: {
    borderColor: '#FF4B8B',
    backgroundColor: '#FFF0F5',
  },
  generoTexto: {
    fontSize: 16,
    color: '#666',
  },
  generoTextoAtivo: {
    color: '#FF4B8B',
    fontWeight: 'bold',
  },
  botao: {
    backgroundColor: '#FF4B8B',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
