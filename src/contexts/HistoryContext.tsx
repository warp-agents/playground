"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ExpandedViewType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export interface View {
  id: string;
  type: ExpandedViewType;
  data?: any;
}

interface HistoryContextType {
  views: View[];
  currentIndex: number;
  currentView: View | null;
  addView: (view: Omit<View, 'id'>) => void;
  goForward: () => void;
  goBackward: () => void;
  clearHistory: () => void;
  canGoForward: boolean;
  canGoBackward: boolean;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}

interface HistoryProviderProps {
  children: ReactNode;
}

export function HistoryProvider({ children }: HistoryProviderProps) {
  const [views, setViews] = useState<View[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentView = views[currentIndex] || null;
  const canGoForward = currentIndex < views.length - 1;
  const canGoBackward = currentIndex > 0;

  const addView = (viewData: Omit<View, 'id'>) => {
    const newView: View = {
      ...viewData,
      id: uuidv4(),
    };

    const newViews = views.slice(0, currentIndex + 1);
    newViews.push(newView);
    
    setViews(newViews);
    setCurrentIndex(newViews.length - 1);
  };

  const goForward = () => {
    if (canGoForward) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goBackward = () => {
    if (canGoBackward) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const clearHistory = () => {
    setViews([]);
    setCurrentIndex(0);
  };

  return (
    <HistoryContext.Provider
      value={{
        views,
        currentIndex,
        currentView,
        addView,
        goForward,
        goBackward,
        clearHistory,
        canGoForward,
        canGoBackward,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
}