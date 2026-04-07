import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import { router } from 'expo-router';

// ─── Tab roots ────────────────────────────────────────────────────────────────
const TAB_ROOTS = new Set([
  '/',
  '/tonight',
  '/map',
  '/bars',
  '/gallery',
  '/account',
]);

function isTabRoot(path: string): boolean {
  return TAB_ROOTS.has(path);
}

// ─── Types ────────────────────────────────────────────────────────────────────
type NavigationHistoryContextValue = {
  canGoBack: boolean;
  goBack: () => void;
  recordVisit: (path: string) => void;
  resetStack: (path: string) => void;
};

// ─── Context ──────────────────────────────────────────────────────────────────
const NavigationHistoryContext = createContext<NavigationHistoryContextValue>({
  canGoBack: false,
  goBack: () => {},
  recordVisit: () => {},
  resetStack: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function NavigationHistoryProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<string[]>([]);

  // Counts how many upcoming recordVisit calls to skip.
  const skipRef = useRef(0);

  // Tracks the last path we actually recorded — synchronously, so duplicate
  // fires that arrive before React commits the state update are caught instantly.
  const lastRecordedRef = useRef<string | null>(null);

  const recordVisit = useCallback((path: string) => {
    if (skipRef.current > 0) {
      skipRef.current -= 1;
      console.log('[HISTORY] SKIPPED:', path, '| skipRef now:', skipRef.current);
      return;
    }

    // Synchronous duplicate check — catches the case where Expo fires the
    // pathname change twice before React batches the setStack update.
    if (lastRecordedRef.current === path) {
      console.log('[HISTORY] DUPLICATE (sync):', path);
      return;
    }

    // Tab roots are ignored unless the stack is empty — only resetStack
    // (called on tab press) is allowed to wipe history to a root.
    // Without this, router.replace to a detail page causes Expo to flash
    // through the tab root first, wiping the real origin from the stack.
    if (isTabRoot(path) && stack.length > 0) {
      console.log('[HISTORY] TAB ROOT ignored:', path, '| stack preserved');
      return;
    }

    lastRecordedRef.current = path;
    setStack(prev => {
      if (prev[prev.length - 1] === path) return prev;
      if (isTabRoot(path)) return [path];
      return [...prev, path];
    });
    console.log('[HISTORY] RECORDED:', path);
  }, [stack]);

  const resetStack = useCallback((path: string) => {
    skipRef.current = 1;
    lastRecordedRef.current = path;
    setStack([path]);
    console.log('[HISTORY] RESET to:', path);
  }, []);

  const goBack = useCallback(() => {
    setStack(prev => {
      if (prev.length <= 1) {
        console.log('[HISTORY] goBack: nothing to go back to');
        return prev;
      }
      const newStack = prev.slice(0, -1);
      const target = newStack[newStack.length - 1];
      skipRef.current = 2;
      lastRecordedRef.current = target;
      console.log('[HISTORY] goBack → ', target, '| new stack:', newStack);
      router.replace(target as any);
      return newStack;
    });
  }, []);

  const canGoBack = stack.length > 1;

  return (
    <NavigationHistoryContext.Provider value={{ canGoBack, goBack, recordVisit, resetStack }}>
      {children}
    </NavigationHistoryContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useNavigationHistory() {
  return useContext(NavigationHistoryContext);
}
