import { openDB } from 'idb'

const DB_NAME = 'coach-ai-db'
const DB_VERSION = 1

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const stores = ['users', 'meals', 'bodyData', 'workoutLogs', 'completions', 'water', 'sleep']
      stores.forEach(name => {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: 'id' })
          if (name !== 'users') store.createIndex('userId_date', ['userId', 'date'])
        }
      })
    },
  })
}

export async function getAllUsers() {
  const db = await getDB()
  return db.getAll('users')
}

export async function saveUser(user) {
  const db = await getDB()
  return db.put('users', user)
}

export async function deleteUser(id) {
  const db = await getDB()
  return db.delete('users', id)
}

export async function getRecordsByDate(store, userId, date) {
  const db = await getDB()
  return db.getAllFromIndex(store, 'userId_date', [userId, date])
}

export async function saveRecord(store, record) {
  const db = await getDB()
  return db.put(store, record)
}

export async function deleteRecord(store, id) {
  const db = await getDB()
  return db.delete(store, id)
}

export async function getAllRecords(store, userId) {
  const db = await getDB()
  const all = await db.getAll(store)
  return all.filter(r => r.userId === userId)
}
