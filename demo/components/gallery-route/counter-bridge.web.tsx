import { useEffect } from 'react';
import type { CounterBridgeInput } from './counter-bridge.types';

declare global {
  interface Window {
    __roster?: CounterBridgeInput;
  }
}

export function useCounterBridge(input: CounterBridgeInput): void {
  useEffect(() => {
    window.__roster = input;
    return () => {
      if (window.__roster === input) delete window.__roster;
    };
  }, [input]);
}
