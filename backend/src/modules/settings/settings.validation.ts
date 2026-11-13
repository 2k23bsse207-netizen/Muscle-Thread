import { AppError } from '../../errors/app-error.js'
import * as v from '../../utils/validation.js'

/** Admin input is a percentage (0–100, two decimals at most); storage is basis points. */
export function parseUpdate(input: unknown): { taxRateBps: number } {
  const body = v.object(input, ['taxRatePercent'])
  const percent = body.taxRatePercent
  if (typeof percent !== 'number' || !Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new AppError('taxRatePercent must be a number between 0 and 100', 400)
  }
  if (Math.abs(percent * 100 - Math.round(percent * 100)) > 1e-6) {
    throw new AppError('taxRatePercent supports at most two decimal places', 400)
  }
  return { taxRateBps: Math.round(percent * 100) }
}
