import { DateTime } from 'luxon';
import { connection } from './database';
import mysql, { PoolConnection } from 'mysql2/promise';

export async function day(date: string, model?: string) {
    const conn = await connection();
    try {
        return dayWithConnection(conn, date, model)
    } finally {
        conn.release();
    }
}

export async function dayWithConnection(conn: PoolConnection, date: string, model?: string) {
    // const today = DateTime.now().toISODate();
    var model_where = '';
    var params = [date];
    if (model) {
        model_where = 'AND broker.order.model_name = ?'
        params.push(model)
    }
    const [dbOrders, ] : [any, any] = await conn.query<mysql.QueryResult>(`
        SELECT 
            symbol_src_name as name,
            count(*) as count,
            avg(sell_order_price/buy_order_price) as gains1,
            avg(gains2) as gains2,
            avg(buy_order_price) as buy_order_price,
            avg(bought_quantity) as bought_quantity
        FROM broker.order 
            left join broker.simulations 
            on broker.order.date = simulations.date and broker.order.minute=simulations.minute and broker.order.order=simulations.order and broker.order.model_name=simulations.model_name
            where broker.order.date = ? 
                ${model_where}
            group by symbol_src_name
            order by gains1 desc, buy_order_price desc, gains2 desc, symbol_src_name
    `, params);

    const inputDate = DateTime.fromISO(date);

    const orders : any[] = [];
    for (const order of dbOrders) {
    }
    return { orders: dbOrders };
}
