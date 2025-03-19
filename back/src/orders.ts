/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import fetch from 'node-fetch';
import { IbAPI } from './ib-api';

export async function orders() {
  // 1. Get open positions
  const ibAPI = new IbAPI();
  if (!await ibAPI.isAuthenticated()) {
    return { success: false, error: 'Unauthenticated' };
  }
  const orderRequest = await fetch('https://192.168.0.178:8000/v1/api/iserver/account/orders');
  const { orders } = await orderRequest.json();
  return orders;
}

export async function order(orderId: string) {
  // 1. Get open positions
  const ibAPI = new IbAPI();
  if (!await ibAPI.isAuthenticated()) {
    return { success: false, error: 'Unauthenticated' };
  }
  const orderRequest = await fetch(`https://192.168.0.178:8000/v1/api/iserver/account/order/status/${orderId}`);
  const order = await orderRequest.json();
  return order;
}

export async function trades(orderId: string) {
  const orderRequest = await fetch(`http://192.168.0.150:8000/orders/${orderId}/trades`);
  const order = await orderRequest.json();
  return order;
}

