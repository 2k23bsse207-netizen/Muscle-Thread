import { prisma } from '../../database/prisma.js'
import { transaction } from '../../database/transaction.js'
import { AppError } from '../../errors/app-error.js'
import { Prisma } from '../../generated/prisma/client.js'
import { offset, page } from '../../utils/pagination.js'
import type { CategoryInput, CategoryQuery, CategorySort, CategoryUpdate } from './categories.types.js'

function include(admin: boolean) {
  return { _count: { select: { products: admin ? true : { where: { status: 'ACTIVE' as const } } } } } satisfies Prisma.CategoryInclude
}
function serialize(category: Prisma.CategoryGetPayload<{ include: ReturnType<typeof include> }>) {
  const { _count, ...data } = category
  return { ...data, productCount: _count.products }
}
export async function listCategories(query: CategoryQuery, admin = false) {
  if (!admin && query.status && query.status !== 'ACTIVE') throw new AppError('Only active categories are public', 400)
  const where: Prisma.CategoryWhereInput = {
    status: admin ? query.status : 'ACTIVE',
    ...(query.q ? { OR: [{ name: { contains: query.q, mode: 'insensitive' } }, { slug: { contains: query.q, mode: 'insensitive' } }] } : {}),
  }
  const [categories, total] = await prisma.$transaction([
    prisma.category.findMany({ where, include: include(admin), ...offset(query), orderBy: [{ [query.sortBy]: query.sortOrder }, { id: 'asc' }] }),
    prisma.category.count({ where }),
  ], { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
  return page(categories.map(serialize), total, query)
}
export async function getCategory(identifier: string, admin = false) {
  const category = await prisma.category.findFirst({ where: { OR: [{ id: identifier }, { slug: identifier }], ...(admin ? {} : { status: 'ACTIVE' }) }, include: include(admin) })
  if (!category) throw new AppError('Category not found', 404)
  return serialize(category)
}
export async function createCategory(input: CategoryInput) {
  return serialize(await prisma.category.create({ data: input, include: include(true) }))
}
export async function updateCategory(categoryId: string, input: CategoryUpdate) {
  return transaction(async tx => {
    const current = await tx.category.findUnique({ where: { id: categoryId } })
    if (!current) throw new AppError('Category not found', 404)
    // Products retain their publication state but become hidden while this category is inactive.
    return serialize(await tx.category.update({ where: { id: categoryId }, data: input, include: include(true) }))
  })
}
export async function removeCategory(categoryId: string) {
  return updateCategory(categoryId, { status: 'INACTIVE' })
}
export async function sortCategories(input: CategorySort[]) {
  return transaction(async tx => {
    const count = await tx.category.count({ where: { id: { in: input.map(row => row.id) } } })
    if (count !== input.length) throw new AppError('One or more categories do not exist', 404)
    for (const row of input) await tx.category.update({ where: { id: row.id }, data: { sortOrder: row.sortOrder } })
    return (await tx.category.findMany({ where: { id: { in: input.map(row => row.id) } }, include: include(true), orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] })).map(serialize)
  })
}
