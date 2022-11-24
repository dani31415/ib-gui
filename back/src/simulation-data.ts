/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import mysql from 'promise-mysql'

function findGain(list: any[], date: string): number | null {
    for (const obj of list) {
        if (obj['date'].toString() === date.toString()) {
            return obj['gain'];
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
        }
        for (const key of keys) {
            item[key] = findGain(obj[key], masterItem['date'])
        }
        result.push(item)
    }
    return result;
}

// https://stackoverflow.com/questions/50093144/mysql-8-0-client-does-not-support-authentication-protocol-requested-by-server
// ALTER USER 'user' IDENTIFIED WITH mysql_native_password BY 'password';
export async function simulationData() {
    const connection = await mysql.createConnection({
        host     : 'localhost',
        user     : 'user',
        password : 'password',
        database : 'market',
        timezone : 'Z',
      })
    const simulation = await connection.query(`
        SELECT avg(gain) AS gain, period.date FROM simulation_item 
	        INNER JOIN period ON period.id - 1 = simulation_item.period
            GROUP by period.date ORDER BY period.date DESC
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

    const actualAtOpen = await connection.query(`
        SELECT avg(i2.open/o1.open_price) as gain, date(o1.created_at) as date FROM \`order\` AS o1
            INNER JOIN period AS p1 ON date(o1.created_at)=p1.date
            INNER JOIN period AS p2 ON p1.id=p2.id-1
            INNER JOIN item AS i2 ON i2.date=p2.date AND o1.symbol_id = i2.symbol_id
            WHERE date(o1.created_at)>=? and date(o1.created_at)<=? and status in ('open', 'closed')
            GROUP BY date(o1.created_at)
            ORDER BY date(o1.created_at) DESC
    `, [ min, max ]);

    const actualAtBuy = await connection.query(`
        SELECT avg(i2.open/o1.ask_price_at_buy_order) as gain, date(o1.created_at) as date FROM \`order\` AS o1
            INNER JOIN period AS p1 ON date(o1.created_at)=p1.date
            INNER JOIN period AS p2 ON p1.id=p2.id-1
            INNER JOIN item AS i2 ON i2.date=p2.date AND o1.symbol_id = i2.symbol_id
            WHERE date(o1.created_at)>=? and date(o1.created_at)<=? and status in ('open', 'closed')
            GROUP BY date(o1.created_at)
            ORDER BY date(o1.created_at) DESC
    `, [ min, max ]);

    const actual = await connection.query(`
        SELECT avg(i2.open/o1.buy_position_price) as gain, date(o1.created_at) as date FROM \`order\` AS o1
            INNER JOIN period AS p1 ON date(o1.created_at)=p1.date
            INNER JOIN period AS p2 ON p1.id=p2.id-1
            INNER JOIN item AS i2 ON i2.date=p2.date AND o1.symbol_id = i2.symbol_id
            WHERE date(o1.created_at)>=? and date(o1.created_at)<=? and status in ('open', 'closed')
            GROUP BY date(o1.created_at)
            ORDER BY date(o1.created_at) DESC
    `, [ min, max ]);

    const market = await connection.query(`
        SELECT mean as gain, date FROM market.period where date>=? and date<=? order by date desc
    `, [ min, max ]);

    // return {simulation, actualAtOpen, actual, market}
    const result = transpose( {simulation, actualAtOpen, actualAtBuy, actual, market} )
    return result;
}