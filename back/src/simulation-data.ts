/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import getConnection from './connection';

function findGain(list: any[], date: string): {gain: number, count: number} | null {
    for (const obj of list) {
        if (obj['date'].toString() === date.toString()) {
            return {gain: obj['gain'], count: obj['count']};
        }
    }
    return null;
}

function transpose(obj: any) {
    const keys = Object.keys(obj);
    const master = obj[keys[0]]
    const result = []
    for (const masterItem of master) {
        const item: any = {
            date: masterItem['date'],
            modelName: masterItem['model_name'],
        }
        for (const key of keys) {
            const gc = findGain(obj[key], masterItem['date'])
            item[key] = gc?.gain; 
            item[key + '_count'] = gc?.count;
        }
        result.push(item)
    }
    return result;
}

// AND (NOT ${optimize} OR abs(open_price/last_price - 1) < 0.01)
function orderQuery(field: string, optimize: boolean): string {
    const limit = 1.3;
    return `
    SELECT avg(LEAST(GREATEST(i2.open/o1.${field}, 1/${limit}), ${limit})) as gain, count(*) as count, date(o1.created_at) as date FROM \`order\` AS o1
        INNER JOIN period AS p1 ON date(o1.created_at)=p1.date
        INNER JOIN period AS p2 ON p1.id+1=p2.id
        INNER JOIN item AS i2 ON i2.date=p2.date AND o1.symbol_id = i2.symbol_id
        WHERE date(o1.created_at)>=? and date(o1.created_at)<=? and status in ('open', 'closed')
            AND (NOT ${optimize} OR o1.last_price/o1.open_price >= 0.999)
        GROUP BY date(o1.created_at)
        ORDER BY date(o1.created_at) DESC
    `
}

function orderQuery2(field0: string, field1: string): string {
    return `
    SELECT avg(${field0}/${field1}) as gain, date(o1.created_at) as date FROM \`order\` AS o1
        INNER JOIN period AS p1 ON date(o1.created_at)=p1.date
        INNER JOIN period AS p2 ON p1.id+1=p2.id
        INNER JOIN item AS i2 ON i2.date=p2.date AND o1.symbol_id = i2.symbol_id
        WHERE date(o1.created_at)>=? and date(o1.created_at)<=? and status in ('open', 'closed')
        GROUP BY date(o1.created_at)
        ORDER BY date(o1.created_at) DESC
    `
}

// https://stackoverflow.com/questions/50093144/mysql-8-0-client-does-not-support-authentication-protocol-requested-by-server
// ALTER USER 'user' IDENTIFIED WITH mysql_native_password BY 'password';
export async function simulationData(optimize1: boolean, optimize2: boolean) {
    const connection = await getConnection();
    const simulation = await connection.query(`
        SELECT avg(gain) AS gain, period.date, model_name FROM simulation_item 
	        INNER JOIN period ON period.id = simulation_item.period + 1
            GROUP by period.date, model_name ORDER BY period.date DESC
    `);
    let max = null;
    let min = null;
    for (let item of simulation) {
        if (max == null || item['date']>max) {
            max = item['date'];
        }
        if (min == null || item['date']<min) {
            min = item['date'];
        }
    }

    const actualAtOpen = await connection.query(orderQuery('open_price', optimize2), [ min, max ]);
    const actualAtOrder = await connection.query(orderQuery('last_price', optimize2), [ min, max ]);
    const actualAtBuy = await connection.query(orderQuery('last_price_at_buy_order', optimize2), [ min, max ]);
    const askAtBuy = await connection.query(orderQuery('ask_price_at_buy_order', optimize2), [ min, max ]);
    const actualBeforeCompissions = await connection.query(orderQuery('buy_order_price', optimize2), [ min, max ]);
    const actual = await connection.query(orderQuery('buy_position_price', optimize2), [ min, max ]);

    const market = await connection.query(`
        SELECT mean as gain, date FROM market.period where date>=? and date<=? order by date desc
    `, [ min, max ]);

    // return {simulation, actualAtOpen, actual, market}
    const result = transpose( {simulation, actualAtOpen, actualAtBuy, actualAtOrder, actualBeforeCompissions, actual, askAtBuy, market} )

    if (optimize1) {
        for (const r of result) {
            // last_price / open_price > 1.01
            // 1/(actualAtOrder / actualAtOpen) > 1.01
            if (r.actualAtOpen / r.actualAtOrder > 1.01) {
                r.actualBeforeCompissions = null;
            }
        }
    }
    return result;
}