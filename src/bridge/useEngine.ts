/** Tek sorumluluk: motor snapshot'ını React'e ısındırmadan bağla. */

import { useSyncExternalStore } from 'react'
import type { PyramidEngine, PyramidSnapshot } from '../core/engine/pyramidEngine'

export function useEngine(engine: PyramidEngine): PyramidSnapshot {
  return useSyncExternalStore(
    (onStoreChange) => engine.subscribe(() => onStoreChange()),
    () => engine.snapshot(),
    () => engine.snapshot(),
  )
}
