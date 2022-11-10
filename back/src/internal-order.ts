/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import fetch from 'node-fetch';

export async function internalOrders(conid: number) {
  // 1. Get open positions
  const openOrdersAsync= fetch('http://192.168.0.150:8000/orders?status=open');
  const closingOrdersAsync = fetch('http://192.168.0.150:8000/orders?status=closing');
  const [ openOrdersResponse, closingOrdersResponse ] = await Promise.all( [ openOrdersAsync, closingOrdersAsync ]);
  const [ openOrders, closingOrders ] = await Promise.all( [ openOrdersResponse.json(), closingOrdersResponse.json() ]);

  const orders = [];

  for (const order of openOrders) {
    if (parseInt(order.ib_conid) == conid) {
      orders.push(order);
    }
  }

  for (const order of closingOrders) {
    if (parseInt(order.ib_conid) == conid) {
      orders.push(order);
    }
  }

  return { success: true, orders };
}
