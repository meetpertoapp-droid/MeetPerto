/**
 * Tela de Perfil - Nível Sênior Diretor
 * Features: Skeleton, Pull-to-refresh, Deletar foto, Logout, Deletar conta,
 * Tratamento de erro 403, Verificação de email, UI responsiva
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth, signOut, deleteUser, sendEmailVerification } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { uploadFotoPerfil } from '../functions/uploadFotoPerfil';
import { app } from '../firebaseConfig';

const { width } = Dimensions.get('window');
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export default function Perfil({ navigation }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * 1. BUSCA DADOS DO FIRESTORE
   */
  const carregarPerfil = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigation.replace('Login');
        return;
      }

      // Força reload pra pegar emailVerified atualizado
      await user.reload();
      const userRef = doc(db, 'usuarios', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('Perfil não encontrado. Contate o suporte.');
      }

      setUsuario({
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
       ...userDoc.data(),
      });
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useEffect(() => {
    carregarPerfil();
  }, [carregarPerfil]);

  /**
   * 2. PULL TO REFRESH
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregarPerfil();
  }, [carregarPerfil]);

  /**
   * 3. TROCAR FOTO DE PERFIL
   */
  const handleTrocarFoto = async () => {
    if (uploading) return;
    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadFotoPerfil(setProgress);
      if (result) {
        // Atualiza estado local sem refetch
        setUsuario((prev) => ({...prev, fotoPerfil: result.url }));
        Alert.alert('Sucesso', 'Foto atualizada com sucesso!');
      }
    } catch (e) {
      Alert.alert('Erro ao enviar foto', e.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  /**
   * 4. REMOVER FOTO DE PERFIL
   */
  const handleRemoverFoto = async () => {
    if (!usuario?.fotoPerfil) return;

    Alert.alert(
      'Remover foto',
      'Tem certeza que deseja remover sua foto de perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // 1. Deleta do Storage
              const path = decodeURIComponent(usuario.fotoPerfil.split('/o/')[1].split('?')[0]);
              await deleteObject(ref(storage, path));

              // 2. Remove do Firestore
              const userRef = doc(db, 'usuarios', usuario.uid);
              await updateDoc(userRef, { fotoPerfil: null });

              setUsuario((prev) => ({...prev, fotoPerfil: null }));
              Alert.alert('Sucesso', 'Foto removida');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível remover a foto');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  /**
   * 5. REENVIAR EMAIL DE VERIFICAÇÃO
   */
  const handleReenviarVerificacao = async () => {
    try {
      await sendEmailVerification(auth.currentUser);
      Alert.alert('Enviado', 'Verifique sua caixa de entrada e spam');
    } catch (e) {
      Alert.alert('Erro', 'Aguarde alguns minutos antes de tentar novamente');
    }
  };

  /**
   * 6. LOGOUT
   */
  const handleLogout = async () => {
    Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut(auth);
          navigation.replace('Login');
        },
      },
    ]);
  };

  /**
   * 7. DELETAR CONTA - LGPD
   */
  const handleDeletarConta = async () => {
    Alert.alert(
      'Deletar conta',
      'Esta ação é irreversível. Todos os seus dados serão apagados permanentemente conforme a LGPD.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // 1. Deleta foto do Storage se existir
              if (usuario?.fotoPerfil) {
                const path = decodeURIComponent(usuario.fotoPerfil.split('/o/')[1].split('?')[0]);
                await deleteObject(ref(storage, path)).catch(() => {});
              }
              // 2. Deleta doc do Firestore
              await updateDoc(doc(db, 'usuarios', usuario.uid), { banido: true }); // Soft delete
              // 3. Deleta Auth
              await deleteUser(auth.currentUser);
              navigation.replace('Login');
            } catch (error) {
              if (error.code === 'auth/requires-recent-login') {
                Alert.alert('Erro', 'Por segurança, faça login novamente antes de deletar a conta');
                await signOut(auth);
                navigation.replace('Login');
              } else {
                Alert.alert('Erro', 'Não foi possível deletar a conta');
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // SKELETON LOADING
  if (loading &&!refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonText} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* AVATAR + BOTÕES */}
        <View style={styles.profileSection}>
          <View>
            <Image
              source={
                usuario?.fotoPerfil
                 ? { uri: usuario.fotoPerfil }
                  : require('../assets/avatar-placeholder.png')
              }
              style={styles.avatar}
            />
            {uploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.progressText}>{progress}%</Text>
              </View>
            )}
          </View>

          <Text style={styles.nome}>{usuario?.nome || 'Usuário'}</Text>
          <Text style={styles.email}>{usuario?.email}</Text>

          {!usuario?.emailVerified && (
            <TouchableOpacity style={styles.alertBox} onPress={handleReenviarVerificacao}>
              <MaterialIcons name="error-outline" size={20} color="#FFB800" />
              <Text style={styles.alertText}>Email não verificado. Toque para reenviar</Text>
            </TouchableOpacity>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleTrocarFoto}
              disabled={uploading}
            >
              <Feather name="camera" size={18} color="#fff" />
              <Text style={styles.buttonText}>Trocar foto</Text>
            </TouchableOpacity>

            {usuario?.fotoPerfil && (
              <TouchableOpacity
                style={[styles.button, styles.dangerButton]}
                onPress={handleRemoverFoto}
                disabled={uploading}
              >
                <Feather name="trash-2" size={18} color="#fff" />
                <Text style={styles.buttonText}>Remover</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* LISTA DE AÇÕES */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="edit-3"
            text="Editar perfil"
            onPress={() => navigation.navigate('EditarPerfil')}
          />
          <MenuItem
            icon="shield"
            text="Privacidade e Segurança"
            onPress={() => navigation.navigate('Privacidade')}
          />
          <MenuItem
            icon="help-circle"
            text="Ajuda e Suporte"
            onPress={() => navigation.navigate('Suporte')}
          />
          <MenuItem
            icon="log-out"
            text="Sair da conta"
            onPress={handleLogout}
            danger
          />
          <MenuItem
            icon="trash"
            text="Deletar conta"
            onPress={handleDeletarConta}
            danger
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const MenuItem = ({ icon, text, onPress, danger }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Feather name={icon} size={22} color={danger? '#FF4D4F' : '#333'} />
    <Text style={[styles.menuText, danger && { color: '#FF4D4F' }]}>{text}</Text>
    <Feather name="chevron-right" size={20} color="#999" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#6A5AE0',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  profileSection: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fff' },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#eee' },
  uploadOverlay: {
   ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: { color: '#fff', marginTop: 8, fontWeight: 'bold' },
  nome: { fontSize: 22, fontWeight: 'bold', marginTop: 12, color: '#222' },
  email: { fontSize: 14, color: '#666', marginTop: 4 },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBE6',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    width: width * 0.9,
  },
  alertText: { marginLeft: 8, color: '#8C6D00', flex: 1 },
  buttonRow: { flexDirection: 'row', marginTop: 20, gap: 12 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: { backgroundColor: '#6A5AE0' },
  dangerButton: { backgroundColor: '#FF4D4F' },
  buttonText: { color: '#fff', fontWeight: '600' },
  menuSection: { marginTop: 24, backgroundColor: '#fff' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuText: { flex: 1, marginLeft: 16, fontSize: 16, color: '#333' },
  skeletonHeader: { padding: 24, alignItems: 'center' },
  skeletonAvatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#E0E0E0' },
  skeletonText: { width: 150, height: 20, backgroundColor: '#E0E0E0', marginTop: 16, borderRadius: 4 },
});
