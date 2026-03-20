import { connection } from './database';
import mysql, { PoolConnection, Pool } from 'mysql2/promise';

export async function model(name: string) {
  const conn = await connection();
  try {
      return await modelWithConnection(conn, name)
  } finally {
      conn.release();
  }
}

async function modelWithConnection(conn: PoolConnection, model: string) {
  // 1. Get open positions
  const [means, ] : [any, any] = await conn.query<mysql.QueryResult>(`
    SELECT 
      avg(mean) as mean
    FROM broker.mean
    WHERE broker.mean.model_name = ?
  `, [model]);

  const [meansMarket, ] : [any, any] = await conn.query<mysql.QueryResult>(`
        select avg(mean) as meanMarket, min(id) as period_start, max(id) as period_end from 
            (SELECT distinct(P.id), mean
                FROM market.period as P
                inner join broker.order as O on P.date=O.date
            where O.model_name = ?) as P
   `, [model]);

  const [orders, ] : [any, any] = await conn.query<mysql.QueryResult>(`
    SELECT 
      count(*) as countAll,
      count(distinct(${'`'}date${'`'})) as nDates,
      count(sell_order_price/buy_order_price) as countValid,
      avg(sell_order_price/buy_order_price) as gains1,
      avg(sell_position_price/buy_position_price) as gains2,
      avg(buy_update_price_factor) as buy_update_price_factor
    FROM broker.order
    WHERE broker.order.model_name = ? and broker.order.status <> 'duplicated'
  `, [model]);

  var r = {...orders[0], meanInterday: means[0].mean, ...meansMarket[0] };
  console.log(r);
  return r;
}
