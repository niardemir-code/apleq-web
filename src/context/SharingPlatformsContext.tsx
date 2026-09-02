import React, { createContext, useContext, useEffect, useState } from 'react';
import { SharingPlatformEntity } from '../types';
import { DEFAULT_SHARING_PLATFORMS } from '../utils/contrast';
import { useAuth } from './AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

interface SharingPlatformsContextType {
  platforms: SharingPlatformEntity[];
  addPlatform: (platform: Omit<SharingPlatformEntity, 'id'>) => Promise<void>;
  updatePlatform: (platform: SharingPlatformEntity) => Promise<void>;
  deletePlatform: (platformId: number | string) => Promise<void>;
  restoreDefaultPlatforms: () => Promise<void>;
}

const STORAGE_KEY = 'splitzy_sharing_platforms';

const SharingPlatformsContext = createContext<SharingPlatformsContextType>({
  platforms: DEFAULT_SHARING_PLATFORMS,
  addPlatform: async () => {},
  updatePlatform: async () => {},
  deletePlatform: async () => {},
  restoreDefaultPlatforms: async () => {},
});

export const SharingPlatformsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [platforms, setPlatforms] = useState<SharingPlatformEntity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_SHARING_PLATFORMS;
  });

  // Sync with Firestore if authenticated
  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/sharing_platforms`;
    const colRef = collection(db, 'users', user.uid, 'sharing_platforms');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        const list: SharingPlatformEntity[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || '',
            colorHex: data.colorHex || '#1285FA',
            displayOrder: data.displayOrder ?? 0,
          });
        });
        list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        setPlatforms(list);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch {
          // ignore
        }
      }
    }, (err) => {
      console.warn('Firestore sharing_platforms sync notice:', err?.message);
    });

    return () => unsubscribe();
  }, [user]);

  // Persist to local storage
  const saveToLocal = (newPlatforms: SharingPlatformEntity[]) => {
    setPlatforms(newPlatforms);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlatforms));
    } catch {
      // ignore
    }
  };

  const addPlatform = async (platform: Omit<SharingPlatformEntity, 'id'>) => {
    const newId = Date.now();
    const newEntity: SharingPlatformEntity = {
      id: newId,
      name: platform.name.trim(),
      colorHex: platform.colorHex.startsWith('#') ? platform.colorHex : `#${platform.colorHex}`,
      displayOrder: platforms.length,
    };

    const updated = [...platforms, newEntity];
    saveToLocal(updated);

    if (user) {
      const docPath = `users/${user.uid}/sharing_platforms/${newId}`;
      try {
        const docRef = doc(db, 'users', user.uid, 'sharing_platforms', String(newId));
        await setDoc(docRef, {
          name: newEntity.name,
          colorHex: newEntity.colorHex,
          displayOrder: newEntity.displayOrder,
        });
      } catch (err) {
        console.error('Error saving platform to Firestore:', err);
        try {
          handleFirestoreError(err, OperationType.CREATE, docPath);
        } catch {
          // Error already audited and logged
        }
      }
    }
  };

  const updatePlatform = async (platform: SharingPlatformEntity) => {
    const cleanHex = platform.colorHex.startsWith('#') ? platform.colorHex : `#${platform.colorHex}`;
    const updated = platforms.map(p => p.id === platform.id ? { ...platform, colorHex: cleanHex } : p);
    saveToLocal(updated);

    if (user) {
      const docPath = `users/${user.uid}/sharing_platforms/${platform.id}`;
      try {
        const docRef = doc(db, 'users', user.uid, 'sharing_platforms', String(platform.id));
        await setDoc(docRef, {
          name: platform.name.trim(),
          colorHex: cleanHex,
          displayOrder: platform.displayOrder ?? 0,
        }, { merge: true });
      } catch (err) {
        console.error('Error updating platform in Firestore:', err);
        try {
          handleFirestoreError(err, OperationType.UPDATE, docPath);
        } catch {
          // Error already audited and logged
        }
      }
    }
  };

  const deletePlatform = async (platformId: number | string) => {
    const updated = platforms.filter(p => p.id !== platformId);
    saveToLocal(updated);

    if (user) {
      const docPath = `users/${user.uid}/sharing_platforms/${platformId}`;
      try {
        const docRef = doc(db, 'users', user.uid, 'sharing_platforms', String(platformId));
        await deleteDoc(docRef);
      } catch (err) {
        console.error('Error deleting platform from Firestore:', err);
        try {
          handleFirestoreError(err, OperationType.DELETE, docPath);
        } catch {
          // Error already audited and logged
        }
      }
    }
  };

  const restoreDefaultPlatforms = async () => {
    saveToLocal(DEFAULT_SHARING_PLATFORMS);

    if (user) {
      const path = `users/${user.uid}/sharing_platforms`;
      try {
        const batch = writeBatch(db);
        for (const p of DEFAULT_SHARING_PLATFORMS) {
          const docRef = doc(db, 'users', user.uid, 'sharing_platforms', String(p.id));
          batch.set(docRef, {
            name: p.name,
            colorHex: p.colorHex,
            displayOrder: p.displayOrder ?? 0,
          });
        }
        await batch.commit();
      } catch (err) {
        console.error('Error restoring default platforms in Firestore:', err);
        try {
          handleFirestoreError(err, OperationType.WRITE, path);
        } catch {
          // Error already audited and logged
        }
      }
    }
  };

  return (
    <SharingPlatformsContext.Provider
      value={{
        platforms,
        addPlatform,
        updatePlatform,
        deletePlatform,
        restoreDefaultPlatforms,
      }}
    >
      {children}
    </SharingPlatformsContext.Provider>
  );
};

export const useSharingPlatforms = () => useContext(SharingPlatformsContext);
