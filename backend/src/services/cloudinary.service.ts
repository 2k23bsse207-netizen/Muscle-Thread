import { randomUUID } from 'node:crypto'
import { cloudinary } from '../config/cloudinary.js'
import { env } from '../config/env.js'
import { AppError } from '../errors/app-error.js'

/** Every asset this app creates lives under this root; nothing outside is touchable. */
const ROOT_FOLDER = 'move'
export const PRODUCT_IMAGE_FOLDER = `${ROOT_FOLDER}/products`

export type UploadedImage = {
  publicId: string
  secureUrl: string
  width: number
  height: number
  format: string
  bytes: number
}

export type UploadOptions = {
  /** Defaults to `PRODUCT_IMAGE_FOLDER`. */
  folder?: string
  /** Hard payload cap; Cloudinary's own limit is far higher. */
  maxBytes?: number
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function assertConfigured() {
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    // Never mention which variable is missing — that leaks config shape.
    throw new AppError('Image storage is not configured', 503)
  }
}

function reason(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.slice(0, 200)
}

/**
 * Uploads one image from a buffer and returns its secure URL plus public id.
 * The public id must be persisted alongside the URL — it is the only handle
 * for later deletion.
 */
export async function uploadImage(buffer: Buffer, options: UploadOptions = {}): Promise<UploadedImage> {
  assertConfigured()
  if (buffer.length === 0) throw new AppError('Empty image file', 400)
  const maxBytes = options.maxBytes ?? MAX_IMAGE_BYTES
  if (buffer.length > maxBytes) {
    throw new AppError(`Image exceeds ${Math.round(maxBytes / 1024 / 1024)}MB limit`, 413)
  }

  try {
    const result = await new Promise<{ public_id: string; secure_url: string; width: number; height: number; format: string; bytes: number }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: options.folder ?? PRODUCT_IMAGE_FOLDER, public_id: randomUUID(), overwrite: false, resource_type: 'image' },
          (error, response) => {
            if (error) reject(new Error(error.message))
            else if (response) resolve(response)
            else reject(new Error('Image storage returned an empty response'))
          },
        )
        stream.end(buffer)
      },
    )
    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    }
  } catch (error) {
    throw new AppError(`Image upload failed: ${reason(error)}`, 502)
  }
}

/**
 * Deletes one asset by its stored public id. Idempotent: an asset that is
 * already gone counts as success so retries and cleanup paths stay simple.
 * Ids outside the app's own folder are refused — the client never gets to
 * name arbitrary assets.
 */
export async function deleteImage(publicId: string): Promise<void> {
  assertConfigured()
  if (!publicId.startsWith(`${ROOT_FOLDER}/`) || publicId.includes('..')) {
    throw new AppError('Unknown image reference', 400)
  }

  try {
    const result = (await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: 'image',
    })) as { result?: string; http_code?: number }
    const status = result?.result
    // 'ok' = deleted, 'not found' = already gone; both are final states.
    if (status !== 'ok' && status !== 'not found') {
      throw new Error(status ?? 'Image storage returned an empty deletion response')
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(`Image removal failed: ${reason(error)}`, 502)
  }
}

/** Cheap connectivity/auth check used by the smoke script. */
export async function verifyCloudinary(): Promise<{ cloudName: string }> {
  assertConfigured()
  try {
    await cloudinary.api.ping()
  } catch (error) {
    throw new AppError(`Image storage unreachable: ${reason(error)}`, 502)
  }
  return { cloudName: env.cloudinary.cloudName }
}
