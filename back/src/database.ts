import mysql, { PoolConnection, Pool } from 'mysql2/promise';

const access: mysql.ConnectionOptions = {
    user: 'view',
    password: '34k89aftl9345.adb',
    database: 'market',
    port: 3306,
    host: '192.168.0.150',
    timezone: 'utc',
};

let gConnectionPool: Pool | null = null;

export async function connection(): Promise<PoolConnection> {
    if (!gConnectionPool) {
        gConnectionPool = mysql.createPool(access);
    }
    return gConnectionPool.getConnection();
}

