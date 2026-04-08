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

function getSection(path: string): string {
  const parts = path.split('/');
  return parts.length >= 2 ? `/${parts[1]}` : path;
}

function isDetailPage(path: string): boolean {
  return !isTabRoot(path);
}

// These paths must ALWAYS push onto the stack and show a back button.
// Never subject to same-section replace logic.
function isAlwaysPush(path: string): boolean {
  if (path === '/account/settings') return true;
  // /account/<numeric id> — friend or own profile
  if (/^\/account\/\d+$/.test(path)) return true;
  return false;
}

// Sections where detail→detail never happens intentionally.
// Stale Expo pathname fires in these sections are replaced, not pushed.
const REPLACE_SECTIONS = new Set([
  '/bars',
  '/gallery',
  '/tonight',
  '/map',
]);

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

  const skipRef = useRef(0);
  const lastRecordedRef = useRef<string | null>(null);

  const recordVisit = useCallback((path: string) => {
    if (skipRef.current > 0) {
      skipRef.current -= 1;
      console.log('[HISTORY] SKIPPED:', path, '| skipRef now:', skipRef.current);
      return;
    }

    if (lastRecordedRef.current === path) {
      console.log('[HISTORY] DUPLICATE (sync):', path);
      return;
    }

    lastRecordedRef.current = path;

    setStack(prev => {
      // Tab root guard — only resetStack (tab press) can set a root.
      if (isTabRoot(path) && prev.length > 0) {
        console.log('[HISTORY] TAB ROOT ignored:', path, '| stack preserved');
        return prev;
      }

      const last = prev[prev.length - 1];
      const section = getSection(path);

      // Always push these specific paths — they need a back button.
      if (!isAlwaysPush(path)) {
        // For all other sections where detail→detail never happens
        // intentionally, replace instead of push to prevent stale
        // Expo pathname fires from stacking under the real destination.
        if (
          last &&
          isDetailPage(path) &&
          isDetailPage(last) &&
          getSection(last) === section &&
          REPLACE_SECTIONS.has(section)
        ) {
          console.log('[HISTORY] SAME-SECTION DETAIL replace:', last, '→', path);
          return [...prev.slice(0, -1), path];
        }
      }

      if (last === path) return prev;
      if (isTabRoot(path)) return [path];
      return [...prev, path];
    });

    console.log('[HISTORY] RECORDED:', path);
  }, []);

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

      if (isTabRoot(target)) {
        skipRef.current = 1;
        lastRecordedRef.current = target;
        console.log('[HISTORY] goBack → TAB ROOT', target, '| stack reset to:', [target]);
        router.replace(target as any);
        return [target];
      }

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
