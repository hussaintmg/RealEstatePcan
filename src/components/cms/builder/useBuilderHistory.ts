'use client';

import { useState, useCallback, useRef } from 'react';
import { SectionInstance } from '@/lib/cms/sdk/types';

interface HistoryState {
  past: SectionInstance[][];
  present: SectionInstance[];
  future: SectionInstance[][];
}

const MAX_HISTORY_STEPS = 30;

export function useBuilderHistory(initialSections: SectionInstance[] = []) {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialSections,
    future: [],
  });

  const lastPushTimestampRef = useRef<number>(0);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const setSections = useCallback((newSections: SectionInstance[], coalesce = false) => {
    setHistory((prev) => {
      const now = Date.now();
      // If coalesce is true and change happened within 800ms, update present without adding extra step
      if (coalesce && now - lastPushTimestampRef.current < 800 && prev.past.length > 0) {
        return {
          ...prev,
          present: newSections,
          future: [],
        };
      }

      lastPushTimestampRef.current = now;
      const newPast = [...prev.past, prev.present].slice(-MAX_HISTORY_STEPS);
      return {
        past: newPast,
        present: newSections,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const resetHistory = useCallback((sections: SectionInstance[]) => {
    setHistory({
      past: [],
      present: sections,
      future: [],
    });
  }, []);

  return {
    sections: history.present,
    setSections,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  };
}
