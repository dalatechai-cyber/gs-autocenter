import { useState, useCallback } from 'react';
import type { Stage } from '../data/types';

export function useStage(initial: Stage = 'exterior') {
  const [stage, setStage] = useState<Stage>(initial);
  const goTo = useCallback((s: Stage) => setStage(s), []);
  return { stage, goTo };
}
