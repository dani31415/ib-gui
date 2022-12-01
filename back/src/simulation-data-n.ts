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
            modelName: masterItem['model_name'],
        }
        for (const key of keys) {
            item[key] = findGain(obj[key], masterItem['date'])
        }
        result.push(item)
    }
    return result;
}

function quotient(array: any[]): any[] {
    let previous = {period:null, id:null};
    const result = []
    let current: any = {}
    for (const obj of array) {
        // Group by obj.period and obj.id
        if (obj.period != previous.period || obj.id != previous.id) {
            current = {
                period: obj.period,
                id: obj.id,
                v1: obj.v1,
                gain: obj.v1 / obj.v0,
                date: null,
                model_name: obj.model_name,
            }
            result.push(current);
        }
        previous = obj;
        current.gain = current.v1 / obj.v0
        current.date = obj.date
    }
    return result;
}

function product(product: any[]): any {
    let accum = 1;
    for (let v of product) {
        accum = accum * v;
    }
    return accum;
}

function mean(product: any[]): any {
    let accum = 0;
    for (let v of product) {
        accum = accum + v;
    }
    return accum / product.length;
}

function reduce(array: any[], reduce_func: any): any[] {
    let previous = {period:null, id:null};
    const result = []
    let current: any = {}
    for (const obj of array) {
        // Group by obj.period and obj.id
        if (obj.period != previous.period) {
            current = {
                period: obj.period,
                gain: obj.gain,
                gains: [obj.gain],
                date: obj.date,
                model_name: obj.model_name,
            }
            result.push(current);
        } else {
            // Accumulative mean
            current.gains.push(obj.gain)
            current.gain = reduce_func(current.gains)
            current.date = obj.date
        }
        previous = obj;
    }
    return result;
}

function orderQuery2(field0: string, field1: string): string {
    return `
    SELECT p1.id as period, p2.id as period1, o1.symbol_id as id, ${field0} as v0, ${field1} as v1, date(o1.created_at), i2.date as date FROM \`order\` AS o1
        INNER JOIN period AS p1 ON date(o1.created_at)=p1.date
        INNER JOIN period AS p2 ON p1.id between p2.id-1 and p2.id
        INNER JOIN item AS i2 ON i2.date=p2.date AND o1.symbol_id = i2.symbol_id
        WHERE date(o1.created_at)>=? AND date(o1.created_at)<=? AND status in ('open', 'closed') AND ${field0} is not null AND ${field1} is not null
        GROUP BY i2.date, v0, v1, id, date(o1.created_at), period, period1
        ORDER BY period DESC, id DESC, date DESC
    `
}

async function query(connection: mysql.Connection, field0: string, field1: string, min: number, max: number): Promise<any[]> {
    const queryResult = await connection.query(orderQuery2(field0, field1), [ min, max ]);
    return reduce(quotient(queryResult), mean);
}

// https://stackoverflow.com/questions/50093144/mysql-8-0-client-does-not-support-authentication-protocol-requested-by-server
// ALTER USER 'user' IDENTIFIED WITH mysql_native_password BY 'password';
export async function simulationDataN() {
    const connection = await mysql.createConnection({
        host     : '192.168.0.150',
        user     : 'user',
        password : process.env.DB_PASSWORD,
        database : 'market',
        timezone : 'Z',
      })
    console.log('begin sql')
    const simulationExpanded = await connection.query(`
    SELECT simulation_item.period+1 as period, simulation_item.id, item.open as v0, item.open as v1, period.id as period2, period.date, model_name FROM simulation_item 
      INNER JOIN period ON period.id between simulation_item.period + 1 and simulation_item.period + 2 + 3
      INNER JOIN item ON simulation_item.symbol_id = item.symbol_id and period.date = item.date
      GROUP by simulation_item.period, period.date, model_name, period.id, simulation_item.id 
      ORDER BY simulation_item.period DESC, simulation_item.id, period.date desc
    `);
    const simulation = reduce(quotient(simulationExpanded), mean)

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

    // const lastField = 'i2.open';
    const lastField = 'o1.sell_order_price';
    const actualAtOpen = await query(connection, 'i2.open', lastField, min, max);
    const askAtBuy = await query(connection, 'o1.ask_price_at_buy_order', lastField, min, max);
    const actualAtOrder = await query(connection, 'o1.last_price', lastField, min, max);
    const actualAtBuy = await query(connection, 'o1.last_price_at_buy_order', lastField, min, max);
    const actualBeforeCompissions = await query(connection, 'o1.buy_order_price', 'o1.sell_order_price', min, max);
    const actual = await query(connection, 'o1.buy_position_price', 'o1.sell_position_price', min, max);

    const marketQueryResult = await connection.query(`
    SELECT p.id AS period, p2.id as id, p2.mean as gain, p2.date as date FROM market.period as p 
	  INNER JOIN period as p2 ON p2.id between p.id and p.id + 3
      where p.date>=? and p.date<=? and p2.mean is not null
      order by period desc, date desc
    `, [ min, max ]);
    const market = reduce(marketQueryResult, product);

    const result = transpose( {simulation, actualAtOpen, actualAtBuy, actualAtOrder, actualBeforeCompissions, actual, askAtBuy, market} )
    return result;
}
