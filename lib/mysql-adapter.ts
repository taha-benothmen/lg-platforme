import { createConnection, Connection } from "mysql2/promise"

export class MySQLAdapter {
  private connection: Promise<Connection>

  constructor(connectionString: string) {
    this.connection = createConnection(connectionString)
  }

  async queryRaw(query: string, params?: any[]): Promise<any> {
    try {
      const conn = await this.connection
      const [rows] = await conn.query(query, params)
      return rows
    } catch (error) {
      console.error("MySQL query error:", error)
      throw error
    }
  }

  async executeRaw(query: string, params?: any[]): Promise<any> {
    try {
      const conn = await this.connection
      const [result] = await conn.execute(query, params)
      return result
    } catch (error) {
      console.error("MySQL execute error:", error)
      throw error
    }
  }

  async startTransaction(): Promise<any> {
    const conn = await this.connection
    await conn.beginTransaction()
    return conn
  }

  async commitTransaction(transaction: any): Promise<void> {
    await transaction.commit()
  }

  async rollbackTransaction(transaction: any): Promise<void> {
    await transaction.rollback()
  }

  async disconnect(): Promise<void> {
    try {
      const conn = await this.connection
      await conn.end()
    } catch (error) {
      console.error("MySQL disconnect error:", error)
    }
  }
}
