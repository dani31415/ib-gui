/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import fetch from 'node-fetch';
import { IbAPI } from './ib-api';
import { DateTime } from 'luxon';

function computeMarketMean(startDate: string, endDate: string, marketMeans: {[date:string]: number}): number {
  const start = DateTime.fromISO(startDate).startOf('day')
  const end = DateTime.fromISO(endDate).startOf('day');
  let mean: number = 1;
  for (let date = start; date == start || date.diff(end).toMillis() < 0; date = date.plus({day:1})) {
    const dateStr = date.toISODate();
    if (marketMeans.hasOwnProperty(dateStr)) {
      if (marketMeans[dateStr] > 0) {
        mean *= marketMeans[dateStr];
      }
    }
  }
  return mean;
}

export async function report(taxes: boolean, comsissions: boolean) {
  // 1. Get open positions
  const ibAPI = new IbAPI();
  if (!await ibAPI.isAuthenticated()) {
    return { success: false, error: 'Unauthenticated' };
  }
  const ordersRequest = await fetch('http://192.168.0.150:8000/orders');
  const periodsRequest = await fetch('http://192.168.0.150:8000/periods');
  const orders = await ordersRequest.json();
  const periods = await periodsRequest.json();

  const marketMeans: any = {};
  for (const period of periods) {
    marketMeans[period.date] = period.mean;
  }

  const result: any = {};

  for (const order of orders) {
    const key = order.date.toString() + ' ' + order.modelName;
    if (!result.hasOwnProperty(key)) {
      result[key] = [];
    }
    result[key].push(order);
  }

  const result2: any = [];
  for (const key in result) {
    let price = 0;
    let count = 0;
    let total = 0;
    let marketMean = 0;
    let failed = 0;
    let discarded = 0;
    let opening = 0;
    let modelName = null;
    let date = null;
    for (const order of result[key]) {
      date = order.date;
      modelName = order.modelName;
      let gain = order.sellOrderPrice / order.buyOrderPrice;
      if (comsissions) {
        gain = gain * 0.995; // comission
      }
      if (taxes && gain>1) {
        // Taxes
        gain -= 0.25 * (gain - 1);
      }
      if (isFinite(gain) && gain > 0) {
        price += gain;
        count += 1;
        marketMean += computeMarketMean(order.createdAt, order.sellOrderAt, marketMeans);
      }
      if (order.status !== 'failed' || order.description && order.description.indexOf('Cancelled')>=0) {
        total += 1;
      }
      if (order.status === 'failed') {
        failed += 1;
      }
      if (order.status === 'discarded') {
        discarded += 1;
      }
      if (order.status === 'opening') {
        opening += 1;
      }
    }
    result2.push({date, gain: price/count, marketMean: marketMean/count, count, failed, discarded, total, opening, modelName});
  }

  result2.sort( (a:any, b:any) => a.date < b.date ? 1 : -1);

  return result2;
}

export async function simulation(modelName: string) {
  const ordersRequest = await fetch(`http://192.168.0.150:8000/orders?modelName=${modelName}`);
  const simitemsRequest = await fetch(`http://192.168.0.150:8000/simulationitems?modelName=${modelName}`);
  const orders = await ordersRequest.json();
  const simitems = await simitemsRequest.json();
  const result: any[] = [];
  let orderCount = 0;
  let simCount = 0;
  let bothCount = 0;
  let simGains = 0;
  let orderGains = 0;
  for (const order of orders) {
    for (const simitem of simitems) {
      if (order.date === simitem.date && order.order==simitem.order && order.minute == simitem.minute) {
        if (order.buyOrderPrice && order.sellOrderPrice) {
          orderCount += 1;
          orderGains += order.sellOrderPrice / order.buyOrderPrice;
        }
        if (simitem.gains) {
          simCount += 1;
          simGains += simitem.gains;
        }
        if (order.buyOrderPrice && order.sellOrderPrice && simitem.gains) {
          bothCount += 1;
          result.push({
            date: order.date,
            minute: order.minute,
            symbol: order.symbolSrcName,
            orderGains: order.sellOrderPrice / order.buyOrderPrice,
            simGains: simitem.gains,
          })
        }
      }
    }
  }
  let g = 0;
  let c = 0;
  for (const r of result) {
    g += r.orderGains / r.simGains;
    c += 1;
  }
  return {'ratio': g/c, 'match': bothCount/simCount, simGains: simGains/simCount, orderGains: orderGains/orderCount};
}
