// https://www.interactivebrokers.com/api/doc.html
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/lines-between-class-members */
/* eslint-disable max-classes-per-file */
import fetch from 'node-fetch';
import * as sleep from 'sleep';

let accountId: string | undefined = undefined;

export class OrderInfo {
  lastPrice?: number;
  bidPrice?: number;
  askPrice?: number;
  openPrice?: number;
}

export class IbAPI {
  private toFloat(str: string): number | undefined {
    if (!str) return undefined;
    if (str[0] === 'C' || str[0] === 'H') {
      return this.toFloat(str.substring(1));
    }
    return parseFloat(str);
  }

  async isAuthenticated(): Promise<boolean> {
    const request = await fetch('https://192.168.0.178:8000/v1/api/iserver/auth/status', { method: 'post' });
    if (request.status == 401) {
      throw { message: 'Unauthorized', status: 401};
    }
    const json = await request.json();
    return json.authenticated;
  }

  // Does not return open price since it is not available when the market is closed
  async snapshot(conids: number[]): Promise<OrderInfo[]> {
    const result: OrderInfo[] = [];
    if (conids.length === 0) {
      return result;
    }

    const strConids = conids.join(',');
    let done;
    let changes0 = 0;
    let attempts = 0;
    do {
      let changes = 0;
      const request = await fetch(`https://192.168.0.178:8000/v1/api/iserver/marketdata/snapshot?conids=${strConids}&fields=31`);
      if (request.status == 401) {
        throw { message: 'Unauthorized', status: 401};
      }
      const snapshots: any[] = await request.json();
      for (const idx in snapshots) {
        const snapshot = snapshots[idx];
        const orderInfo = {
          lastPrice: this.toFloat(snapshot['31']),
          //bidPrice: this.toFloat(snapshot['84']),
          //askPrice: this.toFloat(snapshot['86']),
          // openPrice: this.toFloat(snapshot['7295']),
        };
        changes += orderInfo.lastPrice !== undefined ? 1 : 0;
        // changes += orderInfo.bidPrice !== undefined ? 1 : 0;
        // changes += orderInfo.askPrice !== undefined ? 1 : 0;
        // changes += orderInfo.openPrice !== undefined ? 1 : 0;
        result[idx] = orderInfo;
      }
      console.log(changes);
      if (changes === 1 * conids.length || attempts === 10) {
        done = true;
      } else if (changes0 < changes) {
        done = false;
        attempts = 0; // reset attempts
      } else {
        done = false;
        attempts += 1;
        sleep.msleep(1000);
      }
      changes0 = changes;
    } while (!done);
    for (const i in result) {
      console.log(conids[i], result[i]);
    }
    return result;
  }
  
  async getAccountId(): Promise<string> {
    if (accountId === undefined) {
      const request = await fetch('https://192.168.0.178:8000/v1/api/portfolio/accounts');
      const accounts = await request.json();
      accountId = accounts[0].accountId;
    }
    return accountId!;
  }
}
