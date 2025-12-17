import { createContext, useContext, useState } from 'react';

const SelectedForestContext = createContext();

export const useSelectedForest = () => {
  const context = useContext(SelectedForestContext);
  if (!context) {
    throw new Error('useSelectedForest must be used within a SelectedForestProvider');
  }
  return context;
};

export const SelectedForestProvider = ({ children }) => {
  const [selectedForest, setSelectedForest] = useState(null);

  return (
    <SelectedForestContext.Provider value={{ selectedForest, setSelectedForest }}>
      {children}
    </SelectedForestContext.Provider>
  );
};

