import fetch from 'node-fetch';

export default async function ibReauthenticate() {
  // 1. Get open positions
  const request = await fetch('http://192.168.0.150:8000/ib/login');
  const json = await request.json();
  return json;
}
