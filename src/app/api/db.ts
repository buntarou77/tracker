import mysql from 'mysql2/promise'


const dbConfig = {
  host:'localhost',
  user:'root',
  password:'Anfisa2014228',
  database:'usersdb',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}


const pool = mysql.createPool(dbConfig)


type QueryParams = (string | number | boolean | null | Date)[];

export async function query(sql: string, params?: QueryParams) {
  const connection = await pool.getConnection()
  try {
    const [results] = await connection.execute(sql, params)
    return results
  } finally {
    connection.release()
  }
}


export { pool }