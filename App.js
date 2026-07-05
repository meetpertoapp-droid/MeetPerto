import { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { ActivityIndicator, View, StatusBar, AppState } from 'react-native';

// Screens
import AuthScreen from './screens/AuthScreen';
import SignUpScreen from './screens/SignUpScreen';
import FeedScreen from './screens/FeedScreen';
import PerfilScreen from './screens/PerfilScreen';
import SettingsScreen from './screens/SettingsScreen';
// ... importa as outras screens que você tiver

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Listener principal do Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Usuário logado
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
        });
      } else {
        // Usuário deslogado
        setUser(null);
      }
      setLoading(false);
    });

    // Listener pra quando o app volta do background
    // Força o Firebase a checar se o token ainda é válido
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        auth.currentUser?.reload();
      }
      appState.current = nextAppState;
    });

    // Cleanup: remove listeners quando o app desmonta
    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, []);

  // Tela de Splash enquanto verifica se tá logado
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#4630EB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Rotas de usuário LOGADO
          <>
            <Stack.Screen name="Feed" component={FeedScreen} />
            <Stack.Screen name="Perfil" component={PerfilScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            {/* Adiciona aqui: RadarScreen, FiltrosScreen, etc */}
          </>
        ) : (
          // Rotas de usuário DESLOGADO
          <>
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
