import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserContextType {
  isPremium: boolean;
  freeUsages: {
    chat: number;
    ocr: number;
    flashcards: number;
    summary: number;
    presentation: number;
    thesis: number;
    lecture: number;
  };
  usageLimits: {
    chat: number;
    ocr: number;
    flashcards: number;
    summary: number;
    presentation: number;
    thesis: number;
    lecture: number;
  };
  incrementUsage: (feature: keyof UserContextType['freeUsages']) => void;
  canUseFeature: (feature: keyof UserContextType['freeUsages']) => boolean;
  setPremium: (isPremium: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [freeUsages, setFreeUsages] = useState({
    chat: 0,
    ocr: 0,
    flashcards: 0,
    summary: 0,
    presentation: 0,
    thesis: 0,
    lecture: 0,
  });

  const setPremium = (premium: boolean) => {
    setIsPremium(premium);
  };

  // Default free limits (can be adjusted)
  const usageLimits = {
    chat: 10,        // 10 free chat messages per day
    ocr: 5,          // 5 free OCR scans per day
    flashcards: 3,   // 3 free flashcard generations per day
    summary: 3,      // 3 free summaries per day
    presentation: 2, // 2 free presentations per day
    thesis: 5,       // 5 free thesis helps per day
    lecture: 2,      // 2 free lecture recordings per day
  };

  const incrementUsage = (feature: keyof typeof freeUsages) => {
    setFreeUsages(prev => ({
      ...prev,
      [feature]: prev[feature] + 1,
    }));
  };

  const canUseFeature = (feature: keyof typeof freeUsages) => {
    if (isPremium) return true;
    return freeUsages[feature] < usageLimits[feature];
  };

  useEffect(() => {
    const loadData = async () => {
      // Reset daily usages at midnight
      const now = new Date();
      const lastReset = await AsyncStorage.getItem('lastUsageReset');
      const today = now.toDateString();

      if (lastReset !== today) {
        setFreeUsages({
          chat: 0,
          ocr: 0,
          flashcards: 0,
          summary: 0,
          presentation: 0,
          thesis: 0,
          lecture: 0,
        });
        await AsyncStorage.setItem('lastUsageReset', today);
      }

      // Load premium status
      const storedPremium = await AsyncStorage.getItem('isPremium') === 'true';
      setIsPremium(storedPremium);
    };

    loadData();
  }, []);

  useEffect(() => {
    const savePremium = async () => {
      await AsyncStorage.setItem('isPremium', isPremium.toString());
    };
    savePremium();
  }, [isPremium]);

  return (
    <UserContext.Provider value={{
      isPremium,
      freeUsages,
      usageLimits,
      incrementUsage,
      canUseFeature,
      setPremium,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};