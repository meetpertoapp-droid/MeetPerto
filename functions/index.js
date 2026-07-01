const functions = require('firebase-functions');
const admin = require('firebase-admin');
const vision = require('@google-cloud/vision');

admin.initializeApp();
const client = new vision.ImageAnnotatorClient();

/**
 * FUNÇÃO 1: MODERAÇÃO DE NUDE - CLOUD VISION
 * Dispara toda vez que uma foto nova sobe pro Storage.
 * Bloqueia e apaga se detectar conteúdo adulto.
 * Exigência da Play Store pra apps com UGC.
 */
exports.moderateImage = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const fileBucket = object.bucket;
  const contentType = object.contentType;

  // 1. Sai se não for imagem
  if (!contentType ||!contentType.startsWith('image/')) {
    console.log(`Arquivo ignorado: ${filePath} não é imagem.`);
    return null;
  }
  
  // 2. Só modera fotos de perfil: fotos_perfil/UID_DO_USER/nome.jpg
  if (!filePath.startsWith('fotos_perfil/')) {
    console.log(`Arquivo ignorado: ${filePath} não é foto de perfil.`);
    return null;
  }

  try {
    const gcsUri = `gs://${fileBucket}/${filePath}`;
    const [result] = await client.safeSearchDetection(gcsUri);
    const detections = result.safeSearchAnnotation;

    console.log(`SafeSearch para ${filePath}:`, detections);

    // 3. Bloqueia se for LIKELY ou VERY_LIKELY pra adulto
    if (detections.adult === 'LIKELY' || detections.adult === 'VERY_LIKELY') {
      const uid = filePath.split('/')[1]; // Pega UID da pasta
      
      // Marca usuário no Firestore
      await admin.firestore().collection('users').doc(uid).update({
        fotoBloqueada: true,
        motivoBloqueio: 'Conteúdo adulto detectado automaticamente',
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Apaga a foto imprópria do Storage
      await admin.storage().bucket(fileBucket).file(filePath).delete();
      
      console.log(`SUCESSO: Foto bloqueada e apagada: ${filePath} do user ${uid}`);
      return { status: 'bloqueado', uid: uid };
    }
    
    console.log(`OK: Foto aprovada: ${filePath}`);
    return { status: 'aprovado' };

  } catch (error) {
    console.error('ERRO na moderação Cloud Vision:', error);
    return null;
  }
});

/**
 * FUNÇÃO 2: SISTEMA ANTI-FAKE - BLOQUEIO POR DENÚNCIAS
 * Dispara toda vez que alguém cria uma denúncia nova.
 * Bane automaticamente com 5 denúncias.
 * Exigência da Play Store: "Reportar e Bloquear" em 1 clique.
 */
exports.bloqueioPorDenuncia = functions.firestore
.document('denuncias/{denunciaId}')
.onCreate(async (snap, context) => {
    const denuncia = snap.data();
    const denunciadoUid = denuncia.denunciadoUid;
    
    if (!denunciadoUid) {
      console.log('Denúncia sem denunciadoUid. Ignorando.');
      return null;
    }
    
    // Conta quantas denúncias ativas o usuário tem
    const denunciasSnapshot = await admin.firestore()
   .collection('denuncias')
   .where('denunciadoUid', '==', denunciadoUid)
   .get();
    
    const totalDenuncias = denunciasSnapshot.size;
    console.log(`Usuário ${denunciadoUid} tem ${totalDenuncias} denúncias.`);

    // REGRA DO README: 5 denúncias = ban automático
    if (totalDenuncias >= 5) {
      // 1. Marca como banido no Firestore
      await admin.firestore().collection('users').doc(denunciadoUid).update({
        banido: true,
        motivoBan: 'Múltiplas denúncias de outros usuários',
        banidoEm: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // 2. Desativa a conta no Firebase Auth pra impedir login
      await admin.auth().updateUser(denunciadoUid, { disabled: true });
      
      console.log(`BANIDO: Usuário ${denunciadoUid} banido automaticamente por ${totalDenuncias} denúncias.`);
    }
    
    return null;
  });
