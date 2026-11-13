import { raw, type RequestHandler } from 'express'
import multer from 'multer'
import { AppError } from '../../errors/app-error.js'
import { MAX_IMAGE_BYTES } from '../../services/cloudinary.service.js'

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
const multipart = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 4, parts: 5, fieldSize: 2048, fieldNameSize: 40 },
  fileFilter: (_req, file, done) => {
    if (!imageTypes.has(file.mimetype)) {
      return done(new AppError('Choose a JPEG, PNG, WebP, GIF or AVIF image', 400))
    }
    done(null, true)
  },
}).single('file')
const binary = raw({ type: ['image/*', 'application/octet-stream'], limit: MAX_IMAGE_BYTES })

// MIME claims alone are not trusted. Cloudinary still performs image decoding.
function imageType(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png'
  if (['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))) return 'image/gif'
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  if (buffer.length >= 16 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const size = buffer.readUInt32BE(0)
    if (size >= 16 && size <= buffer.length) {
      const brands = [buffer.toString('ascii', 8, 12)]
      for (let i = 16; i + 4 <= Math.min(size, 256); i += 4) brands.push(buffer.toString('ascii', i, i + 4))
      if (brands.some(brand => brand === 'avif' || brand === 'avis')) return 'image/avif'
    }
  }
  return null
}

/** Used only on admin POST/PATCH image routes, after authentication/role checks. */
export const imageBody: RequestHandler = (req, res, next) => {
  const isMultipart = Boolean(req.is('multipart/form-data'))
  const parser = isMultipart ? multipart : binary
  parser(req, res, (error?: unknown) => {
    if (error instanceof multer.MulterError) {
      return next(new AppError(
        error.code === 'LIMIT_FILE_SIZE' ? 'Each image must be 5 MB or smaller' : 'Upload one file named file with only colorId, altText, sortOrder and isPrimary metadata',
        error.code === 'LIMIT_FILE_SIZE' ? 413 : 400,
      ))
    }
    if (error) {
      if (error instanceof AppError) return next(error)
      const tooLarge = error instanceof Error && 'type' in error && error.type === 'entity.too.large'
      return next(new AppError(tooLarge ? 'Each image must be 5 MB or smaller' : 'Invalid image upload request', tooLarge ? 413 : 400))
    }
    const file = req.file
    if (isMultipart && !file) return next(new AppError('An image file named file is required', 400))
    const buffer = file?.buffer ?? (Buffer.isBuffer(req.body) ? req.body : null)
    if (buffer) {
      const type = imageType(buffer)
      if (!type || (file && type !== file.mimetype)) {
        return next(new AppError('The file contents must match a JPEG, PNG, WebP, GIF or AVIF image', 400))
      }
    }
    next()
  })
}
