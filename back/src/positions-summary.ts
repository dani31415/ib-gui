/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import fetch from 'node-fetch';
import { IbAPI } from './ib-api';

function getConIds(orders: any[]) {
  const conids: number[] = [];
  for (const order of orders) {
    conids.push(order.ib_conid);
  }
  return conids;
}

export default async function positionsSummary() {
  // 1. Get open positions
  const ibAPI = new IbAPI();
  if (!await ibAPI.isAuthenticated()) {
    return { success: false, error: 'Unauthenticated' };
  }
  const request = await fetch('http://192.168.0.150:8000/orders?status=open');
  const json = await request.json();

  const conids = getConIds(json);
  try {
    const data = await ibAPI.snapshot(conids);
    let gains = 0;
    let quantity = 0;
    for (const idx in data) {
      if (isFinite(data[idx].lastPrice!) && json[idx].buyOrderPrice) { // might be nan
        gains += data[idx].lastPrice! / json[idx].buyOrderPrice;
        quantity += 1;
      }
    }
    gains /= quantity;
    return { success: true, gains };
  } catch (err: any) {
    if (err.message && err.message === 'Unauthorized') {
      err.success = false; 
      return err;
    } else {
      throw err;
    }
  }
}
