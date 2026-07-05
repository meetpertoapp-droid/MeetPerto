import { useState } from 'react';
import { View, Text, TextInput, Alert, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const traduzErroFirebase = (code) => {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'E-mail ou senha incorretos.';
      case 'auth/invalid-email':
        return 'E-mail inválido.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente mais tarde.';
      case 'auth/network-request-failed':
        return 'Sem conexão com a internet.';
      default:
        return 'Erro ao fazer login. Tente novamente.';
    }
  };

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
      // O onAuthStateChanged no App.js vai redirecionar pra Home
    } catch (error) {
      console.error('Erro login:', error);
      Alert.alert('Erro', traduzErroFirebase(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleEsqueciSenha = async () => {
    if (!email) {
      Alert.alert('Atenção', 'Digite seu e-mail no campo acima para recuperar a senha.');
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        'E-mail enviado',
        'Enviamos um link para redefinir sua senha. Cheque sua caixa de entrada e spam.'
      );
    } catch (error) {
      console.error('Erro reset:', error);
      let msg = 'Não foi possível enviar o e-mail.';
      if (error.code === 'auth/user-not-found') {
        msg = 'Nenhuma conta encontrada com este e-mail.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'E-mail inválido.';
      }
      Alert.alert('Erro', msg);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, padding: 20, justifyContent: 'center' }}
    >
      <Text style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 40, textAlign: 'center' }}>
        MeetPerto
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 15,
          marginBottom: 15,
          borderRadius: 10,
          fontSize: 16
        }}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        accessibilityLabel="Campo de e-mail"
        editable={!loading}
      />
      <TextInput
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 15,
          marginBottom: 10,
          borderRadius: 10,
          fontSize: 16
        }}
        autoComplete="password"
        textContentType="password"
        accessibilityLabel="Campo de senha"
        editable={!loading}
      />

      <TouchableOpacity 
        onPress={handleEsqueciSenha} 
        disabled={resetLoading || loading}
        style={{ alignSelf: 'flex-end', marginBottom: 20 }}
      >
        {resetLoading ? (
          <ActivityIndicator size="small" color="#4630EB" />
        ) : (
          <Text style={{ color: '#4630EB', fontWeight: '600' }}>
            Esqueci minha senha
          </Text>
        )}
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#4630EB" style={{ marginVertical: 20 }} />
      ) : (
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: '#4630EB',
            padding: 15,
            borderRadius: 10,
            alignItems: 'center'
          }}
          accessibilityLabel="Botão entrar"
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
            Entrar
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        onPress={() => navigation.navigate('SignUp')}
        style={{ marginTop: 30 }}
        disabled={loading}
      >
        <Text style={{ textAlign: 'center', color: '#666' }}>
          Não tem conta?{' '}
          <Text style={{ color: '#4630EB', fontWeight: 'bold' }}>
            Cadastre-se
          </Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
