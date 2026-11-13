import { prisma } from '../../database/prisma.js'
import { AppError } from '../../errors/app-error.js'
import { Prisma } from '../../generated/prisma/client.js'
import { deleteImage, uploadImage } from '../../services/cloudinary.service.js'
import type { ImageUpdate, ImageUpload } from './products.types.js'

type StoredImageAsset = { publicId: string | null; url: string }
export type ImageCleanupStatus = 'deleted' | 'retained' | 'not-managed' | 'failed'
type ImageWrite = ImageUpdate & { publicId?: string }

/** Upload once, outside retried transactions. Never persist buffers or client IDs. */
export async function withImageUpload<T>(input: ImageUpdate | ImageUpload, persist: (data: ImageWrite) => Promise<T>): Promise<T> {
  const { colorId, altText, sortOrder, isPrimary } = input
  const uploaded = 'buffer' in input ? await uploadImage(input.buffer) : null
  const data: ImageWrite = { colorId, altText, sortOrder, isPrimary }
  if (uploaded) {
    data.url = uploaded.secureUrl
    data.publicId = uploaded.publicId
  } else if ('url' in input) data.url = input.url

  try {
    return await persist(data)
  } catch (error) {
    if (uploaded) {
      // A commit error can be ambiguous: do not destroy an asset if its row exists.
      const cleanup = await cleanupImageAsset({ publicId: uploaded.publicId, url: uploaded.secureUrl })
      if (cleanup === 'failed') {
        throw new AppError('Image save failed and asset cleanup could not complete; manual cleanup required', 502)
      }
    }
    throw error
  }
}

/**
 * Run only after the image transaction commits. Fail closed if reference checks
 * or Cloudinary fail. All other rows (including inactive/archived ones) count.
 * A soft-removed row keeps its URL/ID for audit and is the only permitted exclusion.
 */
export async function cleanupImageAsset(asset: StoredImageAsset, removedImageId?: string): Promise<ImageCleanupStatus> {
  const publicId = asset.publicId
  if (!publicId) return 'not-managed'

  try {
    // Also protect URL-only references and common versioned/transformed URLs.
    // These are comparisons with a stored ID, never extraction of a deletion ID.
    const referencesUrl = (column: Prisma.Sql) => Prisma.sql`(
      ${column} = ${asset.url}
      OR strpos(${column}, ${publicId}) > 0
      OR strpos(${column}, ${encodeURI(publicId)}) > 0
      OR strpos(${column}, ${encodeURIComponent(publicId)}) > 0
    )`
    const [result] = await prisma.$queryRaw<{ referenced: boolean }[]>(Prisma.sql`
      SELECT EXISTS (
        SELECT 1 FROM "ProductImage" AS image
        WHERE image."id" IS DISTINCT FROM ${removedImageId ?? null}
          AND (image."publicId" = ${publicId} OR ${referencesUrl(Prisma.sql`image."url"`)})
        UNION ALL
        SELECT 1 FROM "Product" AS product
        CROSS JOIN LATERAL unnest(product."images") AS legacy(url)
        WHERE ${referencesUrl(Prisma.sql`legacy.url`)}
        UNION ALL
        SELECT 1 FROM "OrderItem" AS item
        WHERE ${referencesUrl(Prisma.sql`item."image"`)}
        UNION ALL
        SELECT 1 FROM "Category" AS category
        WHERE ${referencesUrl(Prisma.sql`category."imageUrl"`)}
           OR ${referencesUrl(Prisma.sql`category."bannerUrl"`)}
      ) AS referenced
    `)
    if (result?.referenced === true) return 'retained'
    if (result?.referenced !== false) throw new Error('Image reference check returned no result')
    await deleteImage(publicId)
    return 'deleted'
  } catch {
    // Do not turn a committed replacement/removal into a failed database response.
    // No credentials or provider error payloads are logged.
    console.error('Product image asset cleanup failed; manual cleanup required', { publicId })
    return 'failed'
  }
}
