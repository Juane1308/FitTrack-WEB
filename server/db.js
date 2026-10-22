import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg

export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  : null

export async function initializeDatabase() {
  if (!pool) {
    console.warn('DATABASE_URL no está configurada; la API arrancará sin conexión a datos.')
    return
  }

  const schemaPath = fileURLToPath(new URL('./schema.sql', import.meta.url))
  const schema = await readFile(schemaPath, 'utf8')
  await pool.query(schema)
}

export async function query(text, values = []) {
  if (!pool) {
    const error = new Error('La base de datos no está configurada')
    error.code = 'DATABASE_NOT_CONFIGURED'
    throw error
  }

  return pool.query(text, values)
}
