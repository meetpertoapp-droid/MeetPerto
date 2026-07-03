import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import ngeohash from 'ngeohash';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useFocusEffect } from '@react-navigation/native';

const GEOHASH_PRECISION = 5; // 2.4km x 2.4km. Cumpre sua Política de Privacidade
const RAIO_BUSCA_KM = 10; // Busca usuários até 10km

export default function FeedScreen({ navigation }) {
  const [usuariosProximos, setUsuariosProximos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permissaoLocal, setPermissaoLocal] = useState(null);

  // 1. Pede permissão e atualiza localização ao focar na tela
  useFocusEffect(
    useCallback(() => {
      verificarPermissaoEBuscar();
    }, [])
  );

  const verificarPermissaoEBuscar = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissaoLocal(status);

    if (status !== 'granted') {
      setLoading(false);
      Alert.alert(
        'Localização desativada',
        'Ative a localização para ver pessoas perto de você. Não salvamos seu GPS exato.',
        [{ text: 'OK' }]
      );
      return;
    }
    await buscarUsuarios();
  };

  const buscarUsuarios = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      // 2. Pega localização com BAIXA precisão pra não expor GPS exato
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // ~100m de erro. Não é GPS exato
      });

      const { latitude, longitude } = location.coords;
      
      // 3. Gera geohash com precisão 5 = 2.4km. Impossível reverter pra rua
      const meuGeohash = ngeohash.encode(latitude, longitude, GEOHASH_PRECISION);

      // 4. Salva APENAS o geohash no perfil. Nunca lat/lng
      const userRef = doc(db, 'usuarios', user.uid);
      await setDoc(userRef, {
        geohash: meuGeohash,
        ultimaLocalizacao: serverTimestamp(),
        ativo: true,
      }, { merge: true });

      // 5. Busca geohashes vizinhos pra cobrir o raio de 10km
      const geohashesVizinhos = ngeohash.neighbors(meuGeohash);
      const geohashesParaBusca = [meuGeohash, ...Object.values(geohashesVizinhos)];

      // 6. Query no Firestore pelos geohashes. 1 query por geohash
      const promises = geohashesParaBusca.map(hash => {
        const q = query(
          collection(db, 'usuarios'),
          where('geohash', '>=', hash),
          where('geohash', '<=', hash + '~'),
          where('ativo', '==', true)
        );
        return getDocs(q);
      });

      const snapshots = await Promise.all(promises);
      const usuarios = [];
      snapshots.forEach(snap => {
        snap.forEach(doc => {
          const data = doc.data();
          // Não mostra o próprio usuário e não mostra quem não tem foto/nome
          if (doc.id !== user.uid && data.nome && data.fotoUrl) {
            usuarios.push({ id: doc.id, ...data });
          }
        });
      });

      // 7. Remove duplicados e embaralha
      const usuariosUnicos = Array.from(new Map(usuarios.map(u => [u.id, u])).values());
      setUsuariosProximos(usuariosUnicos.sort(() => 0.5 - Math.random()));

    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      Alert.alert('Erro', 'Não foi possível buscar pessoas próximas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    buscarUsuarios();
  };

  // Componente do Card de Usuário
  const renderUsuario = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('Perfil', { userId: item.id })}
      style={{
        flex: 1,
        margin: 5,
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
      }}
    >
      <Image 
        source={{ uri: item.fotoUrl }} 
        style={{ width: '100%', height: 200, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
      />
      <Text style={{ fontWeight: 'bold', fontSize: 16, padding: 10 }}>
        {item.nome}, {item.idade}
      </Text>
    </TouchableOpacity>
  );

  if (permissaoLocal === 'denied') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ textAlign: 'center', fontSize: 16 }}>
          Precisamos da sua localização para mostrar pessoas próximas.{'\n\n'}
          Seu GPS exato nunca é salvo, conforme nossa Política de Privacidade.
        </Text>
        <TouchableOpacity onPress={verificarPermissaoEBuscar} style={{ marginTop: 20, backgroundColor: '#4630EB', padding: 15, borderRadius: 10 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Ativar Localização</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {loading ? (
        <ActivityIndicator size="large" color="#4630EB" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={usuariosProximos}
          renderItem={renderUsuario}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 5 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4630EB" />
          }
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 50, color: '#666' }}>
              Ninguém por perto ainda. Chame seus amigos!
            </Text>
          }
        />
      )}
    </View>
  );
}
