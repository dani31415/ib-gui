/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import fetch from 'node-fetch';
import { IbAPI } from './ib-api';
import { snapshot } from './snapshot';

class ResultPosition {
  conid!: number;
  shortName!: string;
  quantity!: number;
  hasIbPosition!: boolean;
  mktValue?: number;
  pnl?: number;
  incrementRules?: any;
  internal!: any[];
};

export async function positions2() {
  // 1. Get open positions
  const ibAPI = new IbAPI();
  if (!await ibAPI.isAuthenticated()) {
    return { success: false, error: 'Unauthenticated' };
  }
  const accountId = await ibAPI.getAccountId();

  const positionsAsync = await fetch(`https://192.168.0.178:8000/v1/api/portfolio/${accountId}/positions/0`);
  const openOrdersAsync= fetch('http://192.168.0.150:8000/orders?status=open');
  const closingOrdersAsync = fetch('http://192.168.0.150:8000/orders?status=closing');
  const openingOrdersAsync = fetch('http://192.168.0.150:8000/orders?status=opening');
  const [ positionsResponse, openOrdersResponse, closingOrdersResponse, openingOrdersResponse ] 
    = await Promise.all( [ positionsAsync, openOrdersAsync, closingOrdersAsync, openingOrdersAsync ]);
  const [ positions, openOrders, closingOrders, openingOrders ] 
    = await Promise.all( [ positionsResponse.json(), openOrdersResponse.json(), closingOrdersResponse.json(), openingOrdersResponse.json() ]);

  const result = []
  const internalOrders = openOrders.concat(closingOrders, openingOrders);
  for (const position of positions) {
    let resultPosition: ResultPosition = {
      conid: position['conid'],
      shortName: position['ticker'] ?? position['contractDesc'],
      quantity: position['position'],
      hasIbPosition: true,
      mktValue: position['mktValue'],
      pnl: position['realizedPnl'] + position['unrealizedPnl'],
      incrementRules: position['incrementRules'],
      internal: [],
    };
    result.push(resultPosition);
  }

  for (let order of internalOrders) {
    let found = false;
    for (const resultPosition of result) {
      if (parseInt(order.ib_conid) === resultPosition.conid) {
        found = true;
      }
    }
    if (!found) {
      let resultPosition: ResultPosition = {
        conid: parseInt(order.ib_conid),
        shortName: order.symbol.shortName,
        quantity: order.quantity,
        hasIbPosition: false,
        mktValue: undefined,
        pnl: undefined,
        incrementRules: undefined,
        internal: [],
      };
      result.push(resultPosition);
    }
  }

  for (const resultPosition of result) {
    for (let order of internalOrders) {
      if (parseInt(order.ib_conid) === resultPosition.conid) {
        let resultInernalOrder = {
          id: order.id,
          status: order.status,
          quantity: order.quantity
        }
        resultPosition.internal.push(resultInernalOrder);
      }
    }
  }
  return { success: true, positions: result };
}
