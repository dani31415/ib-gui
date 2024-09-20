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
import { report, report2, simulation } from './src/report';
import { train, trainProcess, trainRun, trainSummary } from './src/train';
import { jobs, job } from './src/jobs';
import { symbol } from './src/symbol';
import { day } from './src/day';
import { items } from './src/items';
import { realtime } from './src/realtime';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

require('dotenv').config();

const apiProxy = httpProxy.createProxyServer({
  target: 'https://192.168.0.178:8000',
  secure: false,
  cookieDomainRewrite: 'danjau.synology.me',
  cookiePathRewrite: '/',
  // hostRewrite: 'localhost:8000',
  // autoRewrite: false,
  // changeOrigin: false,
  // xfwd: false,
});

// apiProxy.on('proxyRes', function (proxyRes, req, res) {
//   const cookies = proxyRes.headers['set-cookie'];
//   if (cookies) {
//     for (let i=0;i< cookies!.length; i+=1) {
//       cookies[i] = cookies[i].replace('; secure','');
//       cookies[i] = cookies[i].replace(';Secure','');
//       console.log(i, cookies[i]);
      
//     }
//   }
//   // var body: Uint8Array [] = [];
//   // proxyRes.on('data', function (chunk) {
//   //   res.write(chunk);
//   //     // body.push(chunk);
//   // });
//   // proxyRes.on('end', function () {
//   //     // var str = Buffer.concat(body).toString();
//   //     // console.log("res from proxied server:", str);
//   //     res.end();
//   // });
//   // console.log('Cookies', JSON.stringify(proxyRes.headers['set-cookie'], null, 2));
// });

const gitProxy = httpProxy.createProxyServer({
  target: 'http://192.168.0.150:8080',
  secure: false,
});
const app = express();

// app.get('/sso/Dispatcher*', function(req, res){
//   // console.log('GET dispatch');
//   console.log('GET', req.url);
//   apiProxy.web(req, res);
//   // res.redirect('/'); // Redirected to home
// });

// app.post('/sso/Dispatcher*', function(req, res){
//   // console.log('POST dispatch');
//   // console.log(req.hostname);
//   console.log('POST', req.url);
//   // console.log(req.headers);
//   apiProxy.web(req, res);
//   // res.redirect('/'); // Redirected to home
//   // res.setHeader('Location',
//   //  'https://www.interactivebrokers.com/Universal/servlet/AccountAccess.AuthenticateSSO?ip2loc=US&loginType=0&forwardTo=22&clt=0&RL=1');
// });

app.all("/github-webhook/*", function(req, res) {
  gitProxy.web(req, res);
});

app.all("/sso/*", function(req, res) {
  // req.headers['host'] = 'localhost:30303';
  // req.headers['origin'] = 'http://localhost:30303';
  // if ('referer' in req.headers) {
  //   const url0 = new URL(req.headers['referer']!)
  //   const url1 = new URL(url0.pathname + url0.search, 'http://localhost:30303')
  //   req.headers['referer'] = url1.toString();
  // }
  // req.hostname = 'localhost';
  console.log(req.method, req.url);
  // if (req.url.indexOf('Login') > 0 || req.url.indexOf('Dispatcher') > 0 || req.url.indexOf('Authenticator') > 0) {
  //   console.log(req.headers);
  // }

  apiProxy.web(req, res);
});

app.all("/css/*", function(req, res) {
  apiProxy.web(req, res);
});

app.all("/fonts/*", function(req, res) {
  apiProxy.web(req, res);
});

app.all("/en/*", function(req, res) {
  apiProxy.web(req, res);
});

app.all("/scripts/*", function(req, res) {
  apiProxy.web(req, res);
});

app.all("/images/*", function(req, res) {
  apiProxy.web(req, res);
});

app.all("/portal.proxy/*", function(req, res) {
  apiProxy.web(req, res);
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

app.get('/api/jenkins/jobs/:name', async (req, res) => {
  try {
    console.log('Connection done!');
    const result = await job(req.params.name);
    res.send({success: true, job: result});
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/jenkins/jobs', async (req, res) => {
  try {
    console.log('Connection done!');
    const jobsResult = await jobs();
    res.send( {success: true, jobs: jobsResult });
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

app.get('/api/simulation3', async (req, res) => {
  try {
    console.log('Connection done!');
    if (req.query.modelName) {
      const simulationResult = await simulation(req.query.modelName as string);
      res.send({success: true, simulation: simulationResult});
    } else {
      res.send({error: 'Missing modelName.'});
    }
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/report', async (req, res) => {
  try {
    console.log('Connection done!');
    const taxes = req.query.taxes === 'true'
    const commissions = req.query.commissions === 'true'

    const reportResult = await report(taxes, commissions);
    res.send({success: true, report: reportResult});
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/report2', async (req, res) => {
  try {
    console.log('Connection done!');
    const taxes = req.query.taxes === 'true'
    const commissions = req.query.commissions === 'true'

    const reportResult = await report2(taxes, commissions);
    res.send({success: true, report: reportResult});
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/train/process', async (req, res) => {
  try {
    console.log('Connection done!');

    const trainResult = await trainProcess();
    res.send({success: true, train: trainResult});
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/train/run', async (req, res) => {
  try {
    console.log('Connection done!');

    const trainResult = await trainRun();
    res.send({success: true, train: trainResult});
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/train/summary', async (req, res) => {
  try {
    console.log('Connection done!');

    const trainResult = await trainSummary();
    res.send({success: true, summary: trainResult});
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/train', async (req, res) => {
  try {
    console.log('Connection done!');

    const trainResult = await train();
    res.send({success: true, train: trainResult});
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/symbols/:name/:date', async (req, res) => {
  try {
    console.log('Connection done!');
    const result = await symbol(req.params.name, req.params.date);
    res.send({success: true, symbol: result });
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/days/:date', async (req, res) => {
  try {
    console.log('Connection done!');
    const result = await day(req.params.date);
    res.send({success: true, day: result });
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/items/:name/:date', async (req, res) => {
  try {
    console.log('Connection done!');
    const result = await items(req.params.name, req.params.date);
    res.send({success: true, items: result });
  } catch (ex: any) {
    res.status(400).send({ error: ex.message ?? 'Error.' });
  }
});

app.get('/api/realtime/:name/:date', async (req, res) => {
  try {
    console.log('Connection done!');
    const result = await realtime(req.params.name, req.params.date);
    res.send({success: true, realtime: result });
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
app.get('/report*', function(req, res) {
  res.sendFile('index.html', {root: __dirname + '/public/'});
});

app.get('/jobs*', function(req, res) {
  res.sendFile('index.html', {root: __dirname + '/public/'});
});

app.get('/train*', function(req, res) {
  res.sendFile('index.html', {root: __dirname + '/public/'});
});

app.get('/days*', function(req, res) {
  res.sendFile('index.html', {root: __dirname + '/public/'});
});

app.listen(30303, () => {
  console.log('server started at http://localhost:30303');
});
