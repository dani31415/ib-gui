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

async function openOrClosingOrders() {
  const request = await fetch('http://192.168.0.150:8000/orders?status=open');
  const requestClosing = await fetch('http://192.168.0.150:8000/orders?status=closing');
  let json = await request.json();
  const jsonClosing = await requestClosing.json();
  json = json.concat(jsonClosing);
  // filter
  const result: any[] = []
  for (const order of json) {
    // 2412 is a stuck order
    if (order.id !== 2412) {
      result.push(order);
    }
  }
  return result;
}

export default async function positionsSummary() {
  // 1. Get open positions
  const ibAPI = new IbAPI();
  if (!await ibAPI.isAuthenticated()) {
    return { success: false, error: 'Unauthenticated' };
  }

  const orders = await openOrClosingOrders();
  const conids = getConIds(orders);
  try {
    const data = await ibAPI.snapshot(conids);
    let gains = 0;
    let detail : any[] = [];
    let quantity = 0;
    for (const idx in data) {
      if (isFinite(data[idx].lastPrice!) && orders[idx].buyOrderPrice) { // might be nan
        const q = orders[idx].boughtQuantity! - orders[idx].soldQuantity!;
        gains += q * orders[idx].buyOrderPrice * data[idx].lastPrice! / orders[idx].buyOrderPrice;
        detail.push({
          ticker: orders[idx].symbolSrcName,
          buy: orders[idx].buyOrderPrice*q,
          pnl: (data[idx].lastPrice!-orders[idx].buyOrderPrice)*q,
          gains: data[idx].lastPrice! / orders[idx].buyOrderPrice,
        })
        quantity += q * orders[idx].buyOrderPrice;
      }
    }
    gains /= quantity;
    return { success: true, gains, detail };
  } catch (err: any) {
    if (err.message && err.message === 'Unauthorized') {
      err.success = false; 
      return err;
    } else {
      throw err;
    }
  }
}
