import { LIME } from '../theme'

type Props = {
  maxPrice: number
  onMaxPriceChange: (value: number) => void
}

export default function ProductPriceFilter({ maxPrice, onMaxPriceChange }: Props) {
  return (
    <div
      className="mb-7 flex flex-col gap-4 border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between"
      style={{ borderLeft: `3px solid ${LIME}` }}
    >
      <div>
        <label
          htmlFor="max-price"
          className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-white"
        >
          Maximum Price
        </label>
        <input
          id="max-price"
          type="range"
          min="20"
          max="100"
          step="5"
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(Number(e.target.value))}
          className="w-full sm:w-72"
          style={{ accentColor: LIME }}
        />
      </div>

      <p className="font-display text-2xl font-black italic text-white">
        <span className="mr-2 text-[10px] font-bold not-italic uppercase tracking-widest text-white/50">
          Up to
        </span>
        <span style={{ color: LIME }}>$</span>
        {maxPrice.toFixed(0)}
      </p>
    </div>
  )
}