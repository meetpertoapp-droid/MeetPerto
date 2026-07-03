import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [modoCadastro, setModoCadastro] = useState(false);
  const [loading, setLoading] = useState(false);

  const traduzErro = (codigo) => {
    if (codigo === 'auth/invalid-email') return 'Email inválido';
    if (codigo === 'auth/user-not-found') return 'Usuário não encontrado';
    if (codigo === 'auth/wrong-password') return 'Senha incorreta';
    if (codigo === 'auth/email-already-in-use') return 'Esse email já está em uso';
    if (codigo === 'auth/weak-password') return 'Senha fraca. Mínimo 6 caracteres';
    if (codigo === 'auth/invalid-credential') return 'Email ou senha incorretos';
    return 'Erro. Tenta de novo';
  };

  const validar = () => {
    if (!email || !senha || (modoCadastro && !nome)) {
      Alert.alert('Opa', 'Preenche todos os campos');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validar()) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch (error) {
      Alert.alert('Erro no login', traduzErro(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async () => {
    if (!validar()) return;
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, senha);
      
      await setDoc(doc(db, "users", userCred.user.uid), {
        nome: nome,
        email: email,
        uid: userCred.user.uid,
        criadoEm: serverTimestamp(),
        foto: null,
        bio: '',
        latitude: null,
        longitude: null,
        online: true
      });
      
      Alert.alert('Bem-vindo ao MeetPerto!', 'Conta criada com sucesso');
    } catch (error) {
      Alert.alert('Erro no cadastro', traduzErro(error.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>MeetPerto</Text>
      <Text style={styles.subtitulo}>
        {modoCadastro ? 'Crie sua conta' : 'Entre na sua conta'}
      </Text>
      
      {modoCadastro && (
        <TextInput 
          style={styles.input} 
          placeholder="Nome completo" 
          value={nome} 
          onChangeText={setNome}
          placeholderTextColor="#999"
        />
      )}
      
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        keyboardType="email-address" 
        autoCapitalize="none"
        placeholderTextColor="#999"
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Senha" 
        value={senha} 
        onChangeText={setSenha} 
        secureTextEntry
        placeholderTextColor="#999"
      />

      <TouchableOpacity 
        style={[styles.botao, loading && styles.botaoDisabled]} 
        onPress={modoCadastro ? handleCadastro : handleLogin} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.textoBotao}>
            {modoCadastro ? 'Cadastrar' : 'Entrar'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setModoCadastro(!modoCadastro)} disabled={loading}>
        <Text style={styles.link}>
          {modoCadastro ? 'Já tem conta? Fazer login' : 'Não tem conta? Cadastre-se'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 24, 
    backgroundColor: '#fff' 
  },
  logo: { 
    fontSize: 40, 
    fontWeight: '900', 
    textAlign: 'center', 
    marginBottom: 8, 
    color: '#FF6B6B' 
  },
  subtitulo: { 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: 32, 
    color: '#666' 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#E5E5E5', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 16, 
    fontSize: 16, 
    backgroundColor: '#F8F8F8',
    color: '#000'
  },
  botao: { 
    backgroundColor: '#FF6B6B', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 8 
  },
  botaoDisabled: { 
    backgroundColor: '#FFA8A8' 
  },
  textoBotao: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  link: { 
    marginTop: 24, 
    textAlign: 'center', 
    color: '#FF6B6B', 
    fontSize: 15 
  }
});
