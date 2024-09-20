import { connection } from './database';
import mysql, { PoolConnection, Pool } from 'mysql2/promise';

export async function items(name: string, date: string) {
    const conn = await connection();
    try {
        return itemsWithConnection(conn, name, date)
    } finally {
        conn.release();
    }
}

export async function itemsWithConnection(conn: PoolConnection, name: string, date: string) {
    const [result, ] : [any, any] = await conn.query<mysql.QueryResult>('SELECT * FROM symbol WHERE short_name=? AND not disabled ORDER BY id DESC', name);
    const symbol_id = result[0].id;

    // const today = DateTime.now().toISODate();
    const [dbOrders, ] : [any, any] = await conn.query<mysql.QueryResult>(`
       SELECT * FROM market.minute_item where date=? and symbol_id=? order by minute asc;
    `, [date, symbol_id]);
 
    return { data: dbOrders };
}
