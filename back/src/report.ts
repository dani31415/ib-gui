/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import fetch from 'node-fetch';
import { IbAPI } from './ib-api';
import { DateTime } from 'luxon';

function computeMarketMean(startDate: string, endDate: string, marketMeans: {[date:string]: number}): number {
  const start = DateTime.fromISO(startDate).startOf('day')
  const end = DateTime.fromISO(endDate).startOf('day');
  let mean: number = 1;
  for (let date = start; date.diff(end).toMillis() <= 0; date = date.plus({day:1})) {
    const dateStr = date.toISODate();
    if (marketMeans.hasOwnProperty(dateStr)) {
      mean *= marketMeans[dateStr];
    }
  }
  return mean;
}

export async function report() {
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
    if (!result.hasOwnProperty(order.date)) {
      result[order.date] = [];
    }
    result[order.date].push(order);
  }

  const result2: any = [];
  for (const day in result) {
    let price = 0;
    let count = 0;
    let total = 0;
    let marketMean = 0;
    let modelName = null;
    for (const order of result[day]) {
      modelName = order.modelName;
      const gain = order.sellOrderPrice / order.buyOrderPrice;
      if (gain > 0) {
        price += gain;
        count += 1;
        marketMean += computeMarketMean(order.createdAt, order.sellOrderAt, marketMeans);
      }
      total += 1;
    }
    result2.push({date: day, gain: price/count, marketMean: marketMean/count, count, total, modelName});
  }

  result2.sort( (a:any, b:any) => a.date < b.date ? 1 : -1);

  return result2;
}
