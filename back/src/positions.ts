/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import fetch from 'node-fetch';
import { IbAPI } from './ib-api';
import { snapshot } from './snapshot';

export async function positions() {
  // 1. Get open positions
  const ibAPI = new IbAPI();
  if (!await ibAPI.isAuthenticated()) {
    return { success: false, error: 'Unauthenticated' };
  }
  const accountId = await ibAPI.getAccountId();
  const request = await fetch(`https://192.168.0.178:8000/v1/api/portfolio/${accountId}/positions/0`);
  const positions = await request.json();
  return { success: true, positions };
}

export async function position(conid: number) {
  // 1. Get open positions
  const ibAPI = new IbAPI();
  if (!await ibAPI.isAuthenticated()) {
    return { success: false, error: 'Unauthenticated' };
  }
  const accountId = await ibAPI.getAccountId();
  const request = await fetch(`https://192.168.0.178:8000/v1/api/portfolio/${accountId}/position/${conid}`);
  const positions = await request.json();
  return { success: true, position: positions[0] };
}

export async function closePosition(conid: number) {
  const ibAPI = new IbAPI();
  if (!await ibAPI.isAuthenticated()) {
    return { success: false, error: 'Unauthenticated' };
  }
  const accountId = await ibAPI.getAccountId();
  const requestPositions = await fetch(`https://192.168.0.178:8000/v1/api/portfolio/${accountId}/position/${conid}`);
  const positions = await requestPositions.json();
  const position = positions[0];

  let price;
  let orderType;

  const orderInfo = (await snapshot([conid]))[0];

  if (position.position! < 1) {
    price = orderInfo?.bidPrice;
    orderType = 'LMT';
  } else {
    // MIDPRICE does not seem to work with fractional quantities
    price = orderInfo?.bidPrice;
    orderType = 'MIDPRICE';
  }

  const ibOrder = {
    conid: conid,
    orderType,
    price,
    side: 'SELL',
    tif: 'DAY',
    quantity: position.position
  };
  console.log('Place order: ', ibOrder);
  let request = null;
  // Create order
  const url = `https://192.168.0.178:8000/v1/api/iserver/account/${accountId}/orders`;
  request = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ orders: [ibOrder] }),
  });
  
  let jsonResult = await request.json();
  console.log('Result: ', jsonResult);
  if (jsonResult.error) {
    throw new Error(jsonResult.error);
  }

  // Reply to answer?
  let needsReply = jsonResult[0].message && jsonResult[0].message.length > 0;
  while (needsReply) {
    console.log(jsonResult[0].message[0]);
    const replyid = jsonResult[0].id;
    const replyUrl = `https://192.168.0.178:8000/v1/api/iserver/reply/${replyid}`;
    const replyRequest = await fetch(replyUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ confirmed: true }),
    });
    jsonResult = await replyRequest.json();
    console.log('Result:', jsonResult);
    if (jsonResult.error) {
      throw new Error(jsonResult.error);
    }

    needsReply = jsonResult[0].message && jsonResult[0].message.length > 0;
    if (!needsReply) {
      return jsonResult[0].order_id;
    }
  }
  return jsonResult[0].id;
}