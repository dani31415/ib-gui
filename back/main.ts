/* eslint-disable no-restricted-syntax */
import express from 'express';
import positionsSummary from './src/positions-summary';
import { closePosition, position, positions } from './src/positions';
import { positions2 } from './src/positions2';
import jenkinsStatus from './src/jenkins-status';
import ibReauthenticate from './src/ib-reauthenticate';
import httpProxy from 'http-proxy';
import { internalOrders } from './src/internal-order';
import { snapshot } from './src/snapshot';
import { order, orders } from './src/orders';
import { simulationData } from './src/simulation-data';
import { simulationDataN } from './src/simulation-data-n';
import { report } from './src/report';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

require('dotenv').config();

const apiProxy = httpProxy.createProxyServer();
const app = express();

app.get('/sso/Dispatcher*', function(req, res){
  apiProxy.web(req, res, {target: 'https://192.168.0.178:8000', secure:false});
  res.redirect('/'); // Redirected to home
});

app.all("/github-webhook/*", function(req, res) {
  apiProxy.web(req, res, {target: 'http://192.168.0.150:8080', secure:false});
});

app.all("/sso/*", function(req, res) {
  apiProxy.web(req, res, {target: 'https://192.168.0.178:8000', secure:false});
});

app.all("/scripts/*", function(req, res) {
  apiProxy.web(req, res, {target: 'https://192.168.0.178:8000', secure:false});
});

app.all("/images/*", function(req, res) {
  apiProxy.web(req, res, {target: 'https://192.168.0.178:8000', secure:false});
});

app.all("/portal.proxy/*", function(req, res) {
  apiProxy.web(req, res, {target: 'https://192.168.0.178:8000', secure:false});
});

app.get('/api/internal/orders/:conid', async (req, res) => {
  try {
    console.log('Connection done!');
    var conid = parseInt(req.params.conid);
    const result = await internalOrders(conid);
    res.send(result);
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/positions/summary', async (req, res) => {
  try {
    console.log('Connection done!');
    const result = await positionsSummary();
    res.send(result);
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/positions/:conid/close', async (req, res) => {
  try {
    console.log('Connection done!');
    var conid = parseInt(req.params.conid);
    const orderId = await closePosition(conid);
    res.send({success: true, orderId});
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/positions/:conid', async (req, res) => {
  try {
    console.log('Connection done!');
    var conid = parseInt(req.params.conid);
    const result = await position(conid);
    res.send(result);
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/positions', async (req, res) => {
  try {
    console.log('Connection done!');
    const result = await positions();
    res.send(result);
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/positions2', async (req, res) => {
  try {
    console.log('Connection done!');
    const result = await positions2();
    res.send({success:true, positions:result});
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/orders/:orderid', async (req, res) => {
  try {
    console.log('Connection done!');
    const result = await order(req.params.orderid);
    res.send({success: true, order: result});
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    console.log('Connection done!');
    const ordersResult = await orders();
    res.send({success: true, orders: ordersResult});
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/conidinfo/:id', async (req, res) => {
  try {
    console.log('Connection done!');
    const result = await snapshot([parseInt(req.params.id)]);
    res.send({success: true, info: result[0]});
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/jenkins/status', async (req, res) => {
  try {
    const result = await jenkinsStatus();
    res.send(result);
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/ib/reauthenticate', async (req, res) => {
  try {
    const result = await ibReauthenticate();
    res.send(result);
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/simulation', async (req, res) => {
  try {
    console.log('Connection done!');
    const optimize1 = req.query.optimize1 === 'true'
    const optimize2 = req.query.optimize2 === 'true'
    const simulation = await simulationData(optimize1, optimize2);
    res.send({success: true, simulation});
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/simulation2', async (req, res) => {
  try {
    console.log('Connection done!');
    const optimize1 = req.query.optimize1 === 'true'
    const optimize2 = req.query.optimize2 === 'true'
    const useEarlyStop = req.query.useEarlyStop === 'true'
    const actualSell = req.query.actualSell === 'true'
    const simulation = await simulationDataN(optimize1, optimize2, useEarlyStop, actualSell);
    res.send({success: true, simulation});
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/report', async (req, res) => {
  try {
    console.log('Connection done!');
    const reportResult = await report();
    res.send({success: true, report: reportResult});
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.use(express.static('public'));
app.get('/positions*', function(req, res) {
  res.sendFile('index.html', {root: __dirname + '/public/'});
});
app.get('/orders*', function(req, res) {
  res.sendFile('index.html', {root: __dirname + '/public/'});
});
app.get('/simulation*', function(req, res) {
  res.sendFile('index.html', {root: __dirname + '/public/'});
});

app.listen(30303, () => {
  console.log('server started at http://localhost:30303');
});
