import 'dotenv/config'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function port(): number {
  const raw = process.env.PORT ?? '4000'
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`Invalid PORT: "${raw}" (expected an integer between 1 and 65535)`)
  }
  return value
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: port(),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },
}
