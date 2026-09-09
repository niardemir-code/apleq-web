import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore (default or custom database ID)
export const db = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export const functions = getFunctions(app);

export async function claimInvite(code: string): Promise<void> {
  const claimSlot = httpsCallable(functions, 'claimSlot');
  await claimSlot({ code });
}

export async function deleteAccountCall(): Promise<void> {
  const deleteAccount = httpsCallable(functions, 'deleteAccount');
  await deleteAccount();
}

export async function leaveGroupCall(groupId: string): Promise<void> {
  const leaveGroup = httpsCallable(functions, 'leaveGroup');
  await leaveGroup({ groupId });
}

// Test Firestore connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    // Expected when unauthenticated, offline, or test doc does not exist
    if (error?.code === 'unavailable' || error?.message?.includes('offline') || error?.code === 'permission-denied') {
      // Benign startup check notice
      return;
    }
  }
}
testConnection();

// Operation types for error auditing
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function isAuthCancellation(err: any): boolean {
  const code = String(err?.code || '');
  const message = String(err?.message || '');
  return (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    code === 'auth/user-cancelled' ||
    code === 'auth/user-denied-permission' ||
    message.includes('auth/user-cancelled') ||
    message.includes('auth/popup-closed-by-user') ||
    message.includes('auth/cancelled-popup-request') ||
    message.includes('IdP denied access') ||
    message.includes('user refused to grant permission') ||
    message.includes('user closed')
  );
}

export async function loginWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err: any) {
    if (isAuthCancellation(err)) {
      // User closed the popup window or cancelled permission - this is a standard cancellation
      console.info('Inicio de sesión con Google cancelado por el usuario.');
      return null;
    }
    if (err?.code === 'auth/popup-blocked') {
      console.warn('El navegador bloqueó la ventana emergente de Google.');
      throw new Error('La ventana emergente de inicio de sesión fue bloqueada por el navegador. Por favor, habilita las ventanas emergentes e inténtalo de nuevo.');
    }
    console.error('Google Sign-In Error:', err);
    throw err;
  }
}

export async function logoutUser() {
  return await firebaseSignOut(auth);
}

export async function registerWithEmail(email: string, password: string, name: string) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name.trim()) {
    await updateProfile(credential.user, { displayName: name.trim() });
  }
  return credential;
}

export async function loginWithEmail(email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email.trim(), password);
}

export function friendlyAuthErrorMessage(err: any): string {
  const code = String(err?.code || '');
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con ese correo. Prueba a iniciar sesión.';
    case 'auth/invalid-email':
      return 'El correo no es válido.';
    case 'auth/weak-password':
      return 'La contraseña es demasiado débil (mínimo 6 caracteres).';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Correo o contraseña incorrectos.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Inténtalo de nuevo más tarde.';
    default:
      return err?.message || 'Ha ocurrido un error. Inténtalo de nuevo.';
  }
}
