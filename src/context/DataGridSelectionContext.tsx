'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface DataGridSelectionContextType {
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  selectPage: (ids: string[]) => void;
  deselectPage: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  isAllPageSelected: (pageIds: string[]) => boolean;
  selectedCount: number;
}

const DataGridSelectionContext = createContext<DataGridSelectionContextType | undefined>(undefined);

export const DataGridSelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectPage = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const deselectPage = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => {
      return selectedIds.has(id);
    },
    [selectedIds]
  );

  const isAllPageSelected = useCallback(
    (pageIds: string[]) => {
      if (pageIds.length === 0) return false;
      return pageIds.every((id) => selectedIds.has(id));
    },
    [selectedIds]
  );

  return (
    <DataGridSelectionContext.Provider
      value={{
        selectedIds,
        toggleSelect,
        selectPage,
        deselectPage,
        clearSelection,
        isSelected,
        isAllPageSelected,
        selectedCount: selectedIds.size,
      }}
    >
      {children}
    </DataGridSelectionContext.Provider>
  );
};

export function useDataGridSelection() {
  const context = useContext(DataGridSelectionContext);
  if (!context) {
    throw new Error('useDataGridSelection must be used within a DataGridSelectionProvider');
  }
  return context;
}
