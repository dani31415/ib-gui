import mysql from 'promise-mysql';

let gConnection: mysql.Connection | undefined;

export default async function getConnection(): Promise<mysql.Connection> {
  if (gConnection !== undefined) {
    try {
      await gConnection.ping();
    } catch {
      console.log('Connection failed');
      gConnection = undefined;
    }
  }

  if (gConnection === undefined) {
    gConnection = await mysql.createConnection({
      host     : '192.168.0.150',
      user     : 'user',
      password : process.env.DB_PASSWORD,
      database : 'market',
      timezone : 'Z',
    });
  }
  return gConnection!;
}
