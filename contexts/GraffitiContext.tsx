import React, { createContext, useState, useContext, ReactNode } from 'react';

// Definim tipurile pentru TypeScript
interface GraffitiData {
  [posterName: string]: string; // ex: { "Poster 2": "data:image/png;base64,iVBORw..." }
}

interface GraffitiContextType {
  graffitis: GraffitiData;
  saveGraffiti: (posterName: string, base64Image: string) => void;
  clearGraffiti: (posterName: string) => void;
}

const GraffitiContext = createContext<GraffitiContextType | undefined>(undefined);

export function GraffitiProvider({ children }: { children: ReactNode }) {
  const [graffitis, setGraffitis] = useState<GraffitiData>({});

  // Funcție pentru a salva sau suprascrie un desen pe un afiș
  const saveGraffiti = (posterName: string, base64Image: string) => {
    setGraffitis((prev) => ({
      ...prev,
      [posterName]: base64Image,
    }));
  };

  // Funcție (opțională) dacă vreți să ștergeți desenul
  const clearGraffiti = (posterName: string) => {
    setGraffitis((prev) => {
      const newState = { ...prev };
      delete newState[posterName];
      return newState;
    });
  };

  return (
    <GraffitiContext.Provider value={{ graffitis, saveGraffiti, clearGraffiti }}>
      {children}
    </GraffitiContext.Provider>
  );
}

// Hook personalizat pentru a folosi contextul mai ușor
export function useGraffiti() {
  const context = useContext(GraffitiContext);
  if (context === undefined) {
    throw new Error('useGraffiti trebuie folosit în interiorul unui GraffitiProvider');
  }
  return context;
}