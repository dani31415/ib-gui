import { DateTime } from 'luxon';
import { connection } from './database';
import mysql, { PoolConnection, Pool } from 'mysql2/promise';

export async function realtime(name: string, date: string) {
    const conn = await connection();
    try {
        return realtimeWithConnection(conn, name, date)
    } finally {
        conn.release();
    }
}

function toDateTime(date: Date|null): DateTime|null {
    if (!date) {
        return null;
    }
    return DateTime.fromJSDate(date).setZone('utc');
}

function minutesFrom(from: DateTime|null, to: DateTime): number|null {
    if (!from) {
        return null;
    }
    return from.diff(to, 'minutes').minutes;
}

export async function realtimeWithConnection(conn: PoolConnection, name: string, date: string) {
    const [result, ] : [any, any] = await conn.query<mysql.QueryResult>('SELECT * FROM symbol WHERE short_name=? AND not disabled ORDER BY id DESC', name);
    const symbol_id = result[0].id;
    
    const inputDate = DateTime.fromISO(date);
    const open = DateTime.local(inputDate.year,inputDate.month,inputDate.day,9,0,0,{zone:'America/New_York'});

    // const today = DateTime.now().toISODate();
    const [dbOrders, ] : [any, any] = await conn.query<mysql.QueryResult>(`
       SELECT * FROM market.snapshot where date=? and symbol_id=? order by datetime asc;
    `, [date, symbol_id]);

    for (const order of dbOrders) {
        order.minute = minutesFrom(toDateTime(order.created_at), open);
    }

    return { data: dbOrders };
}
