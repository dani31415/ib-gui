import { DateTime } from 'luxon';
import { connection } from './database';
import mysql, { PoolConnection, Pool } from 'mysql2/promise';

export async function simulations(symbol: string, date: string, model: string) {
    const conn = await connection();
    try {
        return simulationsWithConnection(conn, symbol, date, model)
    } finally {
        conn.release();
    }
}

export async function simulationsWithConnection(conn: PoolConnection, symbol: string, date: string, model: string) {
    const params = [ model, symbol, date ];
    console.log(params);
    const [simulations, ] : [any, any] = await conn.query<mysql.QueryResult>(`
        SELECT
            *
        FROM broker.simulation_item 
        INNER JOIN market.period ON market.period.id = broker.simulation_item.period
        WHERE model_name=? AND symbol_src_name=? AND market.period.date=?
        ORDER BY broker.simulation_item.id ASC
    `, params);
    return simulations;
}
