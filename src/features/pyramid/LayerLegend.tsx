import { LAYER_NAMES } from '../../core/engine/layerNames'
import { formatEdgeRange } from '../../core/format/edgeRange'

export function LayerLegend({ edges }: { edges: number[] }) {
  return (
    <ul className="legend" data-testid="layer-legend">
      {LAYER_NAMES.map((name, i) => (
        <li key={name}>
          <b>{name}</b>
          <span>{formatEdgeRange(edges[i] ?? 0, edges[i + 1] ?? Infinity)}</span>
        </li>
      ))}
    </ul>
  )
}
