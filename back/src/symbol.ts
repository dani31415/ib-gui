import { DateTime } from 'luxon';
import { connection } from './database';
import mysql, { PoolConnection, Pool } from 'mysql2/promise';

function formatDate(str: string) {
    if (str==null) return '';
    const i = str.indexOf('T');
    return str.substring(0, i);
}

function toDateTime(date: Date|null): DateTime|null {
    if (!date) {
        return null;
    }
    return DateTime.fromJSDate(date).setZone('utc');
}

function dateFormat(date: DateTime|Date|null): string|null {
    if (date == null) {
        return date;
    }
    if (date instanceof Date) {
        return date.toISOString();
    }
    return date.toISO();
}

function minutesFrom(from: DateTime|null, to: DateTime): number|null {
    if (!from) {
        return null;
    }
    return from.diff(to, 'minutes').minutes;
}

function closeOrder(orders: any[], newOrder: any, order: any, oldOrder: any, closed_at: DateTime|null, open: DateTime) {
    if (oldOrder && (!newOrder || oldOrder.id != newOrder.id) && oldOrder.quantity > 0) {
        let ca;
        if (closed_at && order) {
            const created_at_millis = DateTime.fromISO(order.created_at.toISOString());
            const closed_at_millis = closed_at; // DateTime.fromISO(closed_at.toISOString());
            ca = DateTime.fromMillis(Math.min(closed_at_millis.toMillis(), created_at_millis.toMillis())).setZone('utc');
        } else if (closed_at) {
            ca = closed_at;
        } else {
            ca = DateTime.now().setZone('utc');
        }
        orders.push( {
            id: oldOrder.id,
            model_name: oldOrder.model_name,
            side: oldOrder.side,
            price: oldOrder.price,
            quantity: oldOrder.quantity,
            remaining: oldOrder.remaining,
            created_at: ca,
            minute: ca ? minutesFrom(ca, open): null,
            status: 'closed',
        });
    }
}

// CREATE USER 'view'@'192.168.%.%' IDENTIFIED BY '34k89aftl9345.adb';
// GRANT SELECT ON market.* TO 'view'@'192.168.%.%';
// GRANT SELECT ON broker.* TO 'view'@'192.168.%.%';
export async function symbol(name: string, date: string, model?: string) {
    const conn = await connection();
    try {
        return symbolWithConnection(conn, name, date, model)
    } finally {
        conn.release();
    }
}

export async function symbolWithConnection(conn: PoolConnection, name: string, date: string, model?: string) {
    const [symbols, ] : [any, any] = await conn.query<mysql.QueryResult>('SELECT * FROM symbol WHERE short_name=? AND not disabled ORDER BY id DESC', name);
    const symbol_id = symbols[0].id;

    var model_where = '';
    var params = [symbol_id, date];
    if (model) {
        model_where = 'AND broker.order.model_name = ?'
        params.push(model)
    }

    // const today = DateTime.now().toISODate();
    const [dbOrders, ] : [any, any] = await conn.query<mysql.QueryResult>(`
        SELECT
            broker.ib_order.id as id,
            broker.ib_order.order_id as db_id,
            broker.ib_order.side as side,
            broker.order.quantity as purchase_total_quantity,
            broker.order.bought_quantity as sell_total_quantity,
            broker.order.model_name as model_name,
            broker.ib_order_change.quantity as quantity_change,
            broker.ib_order_change.price as price_change,
            broker.ib_order_change.created_at as created_at,
            broker.ib_order_change.status as status,
            broker.ib_order_change.type as type,
            broker.ib_order.closed_at as closed_at,
            null
        FROM broker.order 
        INNER JOIN broker.ib_order ON broker.order.id = broker.ib_order.order_id
        INNER JOIN broker.ib_order_change ON broker.ib_order.id = broker.ib_order_change.ib_order_id
        WHERE symbol_id=? AND date=?
              ${model_where}
        ORDER BY broker.ib_order_change.created_at ASC
    `, params);

    const inputDate = DateTime.fromISO(date);
    const open = DateTime.local(inputDate.year,inputDate.month,inputDate.day,9,0,0,{zone:'America/New_York'});

    const orders : any[] = [];
    let oldOrder : any | null = null;
    let closed_at : DateTime | null = null;
    for (const order of dbOrders) {
        const created_at = DateTime.fromJSDate(order.created_at)
        console.log('created_at', DateTime.fromJSDate(order.created_at).toISO());
        console.log(created_at.diff(open, 'minutes').minutes);
        const newOrder = {
            id:  order.id,
            db_id: order.db_id,
            model_name: order.model_name,
            side: order.side + (order.type == 'STP' ? '+STP' : ''),
            price: order.price_change,
            quantity: order.side=='B' ? order.purchase_total_quantity : order.sell_total_quantity,
            remaining: order.quantity_change,
            created_at: order.created_at,
            minute: minutesFrom(toDateTime(order.created_at), open),
            status: (order.status == 'Filled' || order.status == 'Cancelled') ? 'closed': undefined,
        }
        // console.log(order.id)
        // closeOrder(orders, newOrder, order, oldOrder, closed_at, open)
        orders.push(newOrder);
        oldOrder = newOrder;
        closed_at = toDateTime(order.closed_at);
    }

    // closeOrder(orders, null, null, oldOrder, closed_at, open)

    return { symbol: symbols[0], orders };
}
