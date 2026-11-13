import { mkdtemp, writeFile, chmod } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createServer } from 'node:net'

// Never uses .env or the configured Neon database. Every run gets a fresh local
// PostgreSQL cluster and SCRAM credentials; all synthetic data stays there.
const directory = await mkdtemp(join(tmpdir(), 'move-backend-tests-'))
await chmod(directory, 0o700)
const password = randomBytes(32).toString('hex')
const passwordFile = join(directory, 'password')
await writeFile(passwordFile, password + '\n', { mode: 0o600 })
const data = join(directory, 'data')
const port = await new Promise<number>((resolve, reject) => {
  const server = createServer()
  server.on('error', reject)
  server.listen(0, '127.0.0.1', () => {
    const address = server.address()
    if (!address || typeof address === 'string') return reject(new Error('Unable to reserve local port'))
    server.close(error => error ? reject(error) : resolve(address.port))
  })
})
const url = `postgresql://move_test:${password}@127.0.0.1:${port}/postgres?schema=public`
const env = {
  ...process.env, DATABASE_URL: url, DIRECT_URL: url, TEST_DATABASE_URL: url,
  NODE_ENV: 'test', JWT_SECRET: randomBytes(32).toString('hex'),
  // Provider methods are mocked by endpoint tests; never inherit real credentials.
  CLOUDINARY_CLOUD_NAME: 'local-colour-tests', CLOUDINARY_API_KEY: 'test-only-key', CLOUDINARY_API_SECRET: 'test-only-secret',
}
function run(command: string, args: string[], customEnv = env) {
  const result = spawnSync(command, args, { env: customEnv, encoding: 'utf8', timeout: 180_000 })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status}`)
}
let started = false
try {
  run('initdb', ['-D', data, '--auth=scram-sha-256', '--username=move_test', '--pwfile', passwordFile, '--no-locale', '--encoding=UTF8'])
  run('pg_ctl', ['-D', data, '-l', join(directory, 'postgres.log'), '-o', `-p ${port} -h 127.0.0.1 -k ${directory}`, '-w', 'start'])
  started = true
  run('npx', ['tsx', 'scripts/test-migration.ts'])
  run('npx', ['prisma', 'migrate', 'deploy'])
  run('npx', ['prisma', 'generate'])
  run('npx', ['prisma', 'migrate', 'diff', '--from-config-datasource', '--to-schema', 'prisma/schema.prisma', '--exit-code'])
  run('npx', ['tsx', '--test', '--test-concurrency=1', 'tests/product-colors-migration.test.ts', 'tests/products.test.ts', 'tests/categories.test.ts', 'tests/inventory.test.ts', 'tests/orders.test.ts', 'tests/customers.test.ts', 'tests/discounts.test.ts', 'tests/promotions.test.ts', 'tests/dashboard.test.ts', 'tests/auth-regression.test.ts', 'tests/validation.test.ts'])
  console.log('All endpoint and migration tests completed in isolated PostgreSQL. No application data was used or deleted.')
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  if (started) {
    const result = spawnSync('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop'], { encoding: 'utf8', timeout: 60_000 })
    if (result.stdout) process.stdout.write(result.stdout)
    if (result.status !== 0) { console.error('Could not stop isolated test PostgreSQL'); process.exitCode = 1 }
  }
  console.log(`Isolated test logs/data retained at ${directory}`)
}
