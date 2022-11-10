/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import * as sleep from 'sleep';
import fetch from 'node-fetch';

function toFloat(str: string): number | undefined {
  if (!str) return undefined;
  if (str[0] === 'C' || str[0] === 'H') {
    return toFloat(str.substring(1));
  }
  return parseFloat(str);
}

export async function snapshot(conids: number[]): Promise<any[]> {
  const result: any[] = [];
  if (conids.length === 0) {
    return result;
  }

  const strConids = conids.join(',');
  let done;
  let changes0 = 0;
  let attempts = 0;
  do {
    let changes = 0;
    const request = await fetch(`https://192.168.0.178:8000/v1/api/iserver/marketdata/snapshot?conids=${strConids}&fields=31,86,84,7295,87`);
    const snapshots: any[] = await request.json();
    for (const idx in snapshots) {
      const snapshot = snapshots[idx];
      console.log(snapshot);
      const orderInfo = {
        lastPrice: toFloat(snapshot['31']),
        bidPrice: toFloat(snapshot['84']),
        askPrice: toFloat(snapshot['86']),
        openPrice: toFloat(snapshot['7295']),
        volume: snapshot['87'],
      };
      changes += orderInfo.lastPrice !== undefined ? 1 : 0;
      changes += orderInfo.bidPrice !== undefined ? 1 : 0;
      changes += orderInfo.askPrice !== undefined ? 1 : 0;
      changes += orderInfo.openPrice !== undefined ? 1 : 0;
      changes += orderInfo.volume !== undefined ? 1 : 0;
      result[idx] = orderInfo;
    }
    if (changes === 5 * conids.length || attempts === 10) {
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
  console.log(result);
  return result;
}
