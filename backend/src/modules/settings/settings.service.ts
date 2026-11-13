// Storefront settings: one admin-managed tax rate shared by quotes and orders.
import { prisma } from '../../database/prisma.js'

// Single settings row, created with schema defaults on first read.
const SETTINGS_ID = 1

export type StoreSettings = { taxRateBps: number; taxRatePercent: number }

function serialize(settings: { taxRateBps: number }): StoreSettings {
  return { taxRateBps: settings.taxRateBps, taxRatePercent: settings.taxRateBps / 100 }
}

export async function getStoreSettings() {
  return serialize(await prisma.storeSettings.upsert({ where: { id: SETTINGS_ID }, update: {}, create: { id: SETTINGS_ID } }))
}

/** Tax rate in basis points (800 = 8%) for cart quotes and order totals. */
export async function getTaxRateBps() {
  return (await getStoreSettings()).taxRateBps
}

/** Tax in cents for a subtotal — the one rounding used by quote and checkout. */
export function taxCentsFor(subtotalCents: number, taxRateBps: number) {
  return Math.round(subtotalCents * taxRateBps / 10000)
}

export async function updateStoreSettings(input: { taxRateBps: number }) {
  return serialize(await prisma.storeSettings.upsert({
    where: { id: SETTINGS_ID }, update: input, create: { id: SETTINGS_ID, ...input },
  }))
}
