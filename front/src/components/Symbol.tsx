import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Area, Scatter, CartesianGrid, XAxis, YAxis, ZAxis, ComposedChart, Tooltip } from 'recharts';

function round2(x: number): number {
    return Math.round(x*100)/100;
}

function domainFunc( [m, M] : [number, number], allowedDataOverflow: boolean): [number, number] {
    const d = M-m;
    return [Math.floor(m-0.1*d),Math.ceil(M+0.1*d)];
}

function doContinue(data: any[], field: string, maxX:number) {
    if (data.length>0 && !isNaN(data[data.length-1][field])) {
        console.log('aha!!');
        var p = {...data[data.length-1]}
        if (maxX > p.x) {
          p.x = maxX;
        } else {
          p.x += 5;
        }
        data.push(p);
    }
}

function findClosest(p: any, dataB: any[]) : any|null {
  var q = null;
  for (var d of dataB) {
      if (d.remaining < d.quantity) {
          if (q == null) {
              q = d;
          } else if (Math.abs(d.minute-p.x)<Math.abs(q.minute-p.x)) {
              q = d;
          }
      }
  }
  return q;
}

export default function Symbol() {
    const [dataS, setDataS] : [any[], any] = useState([]);
    const [dataSS, setDataSS] : [any[], any] = useState([]);
    const [dataB, setDataB] : [any[], any] = useState([]);
    const [dataBS, setDataBS] : [any[], any] = useState([]);
    const [tradeB, setTradeB] : [any[], any] = useState([]);
    const [tradeS, setTradeS] : [any[], any] = useState([]);
    const [tradeBS, setTradeBS] : [any[], any] = useState([]);
    const [tradeSS, setTradeSS] : [any[], any] = useState([]);
    const [market, setMarket] : [any[], any] = useState([]);
    const [marketLH, setMarketLH] : [any[], any] = useState([]);
    const [marketRealtime, setMarketRealtime] : [any[], any] = useState([]);
    const [symbol, setSymbol] : [any, any] = useState({});
    const [models, setModels] : [any[], any] = useState([]);
    let [searchParams, setSearchParams] = useSearchParams();

    let { ticker, date } = useParams();

    // const data = [{x: 100, y: 400}, {x: 400, y: 800}, {x: null, y: NaN}, {x: 300, y: 300}, {x: 500, y: 700},];
    useEffect( () => {
        async function action() {
          const response = await fetch(`/api/symbols/${ticker}/${date}?model=${searchParams.get('model') ?? ''}`);
          const itemsResponse = await fetch(`/api/items/${ticker}/${date}`);
          const realtimeResponse = await fetch(`/api/realtime/${ticker}/${date}`);
          const json = await response.json();
          const items = await itemsResponse.json();
          const realtime = await realtimeResponse.json();
          var maxX = 0;
          if (items.success) {
            const market = [];
            const marketLH = [];
            for (const row of items.items.data) {
                market.push( {
                    x: round2(row.minute),
                    y: round2(row.open),
                    z: 0,
                })
                marketLH.push( {
                    x: round2(row.minute),
                    y: [round2(row.low), round2(row.high)],
                    z: 0,
                })
                maxX = Math.max(round2(row.minute), maxX);
            }
            setMarket(market);
            setMarketLH(marketLH);
          } else {
            console.log('error')
          }
          if (realtime.success) {
            const marketRealtime = [];
            for (const row of realtime.realtime.data) {
                marketRealtime.push( {
                    x: round2(row.minute),
                    y: round2(row.last),
                    z: 0,
                })
                maxX = Math.max(round2(row.minute), maxX);
            }
            console.log('marketRealtime', marketRealtime);
            setMarketRealtime(marketRealtime);
          } else {
            console.log('error')
          }
          if (json.success) {
            setSymbol(json.symbol.symbol);
            console.log('orders', json.symbol.orders)
            const models = [];
            const dataS = [];
            const dataSS = [];
            const dataB = [];
            const dataBS = [];
            const tradeB = [];
            const tradeS = [];
            const tradeBS = [];
            const tradeSS = [];
            const ids: string[] = [];
            for (const order of json.symbol.orders) {
                var model_name = order.model_name;
                let p: any = {
                    x: round2(order.minute),
                    z: 0, // order.remaining < order.quantity ? 50:0,
                }
                maxX = Math.max(p.x, maxX)
                if (!ids.includes(order.db_id)) {
                  ids.push(order.db_id);
                  models.push({model_name, db_id: order.db_id, id: order.id});
                }
                if (order.side == 'S') {
                    p.sell = round2(order.price)
                    dataS.push(p);
                } else if (order.side == 'B') {
                    p.buy = round2(order.price)
                    dataB.push(p);
                } else if (order.side == 'S+STP') {
                    p.sellStop = round2(order.price)
                    dataSS.push(p);
                } else if (order.side == 'B+STP') {
                    p.buyStop = round2(order.price)
                    dataBS.push(p);
                }

                if (order.status=='closed') {
                    p = {
                        x: NaN,
                        z: NaN,
                    }
                    if (order.side == 'S') {
                        p.sell = NaN;
                        dataS.push(p);
                    } else if (order.side == 'B') {
                        p.buy = NaN;
                        dataB.push(p);
                    } else if (order.side == 'S+STP') {
                        p.sellStop = NaN;
                        dataSS.push(p);
                    } else if (order.side == 'B+STP') {
                        p.buyStop = NaN;
                        dataB.push(p);
                  }
                }
            }
            doContinue(dataB, 'buy', maxX);
            doContinue(dataS, 'sell', maxX);
            doContinue(dataSS, 'sellStop', maxX);
            doContinue(dataBS, 'buyStop', maxX);
            setDataB(dataB);
            setDataS(dataS);
            setDataSS(dataSS);
            setDataBS(dataBS);
            setModels(models);
            for (var id of ids) {
              const tradesResponse = await fetch(`/api/orders/${id}/trades`);
              const trades = await tradesResponse.json();
              for (const trade of trades.trades) {
                let p: any = {
                  x: round2(trade.minuteSincePreOpen),
                  z: 100,
                }
                if (trade.side == 'B') {
                  var q = findClosest(p, json.symbol.orders)
                  if (q && q.side == 'B+STP') {
                    p.buyStop = trade.price;
                    tradeBS.push(p);
                  } else {
                    p.buy = trade.price;
                    tradeB.push(p);
                  }
                }
                if (trade.side == 'S') {
                  var q = findClosest(p, json.symbol.orders)
                  if (q && q.side == 'S+STP') {
                    p.sellStop = trade.price;
                    tradeSS.push(p);
                  } else {
                    p.sell = trade.price;
                    tradeS.push(p);
                  }
                }
              }
            }
            setTradeB(tradeB);
            setTradeS(tradeS);
            setTradeBS(tradeBS);
            setTradeSS(tradeSS);
            console.log(dataB);
            console.log(dataS);
          } else {
            console.log('error')
          }
        }
    
        action().catch(console.error);
      }, [ ]);


    return (
    <div>
      <ComposedChart width={1200} height={300}>
        <CartesianGrid stroke="#ccc"/>
        <Scatter dataKey="buy" fill='blue' line={true} isAnimationActive={false} data={dataB}/>
        <Scatter dataKey="buyStop" fill='green' line={true} isAnimationActive={false} data={dataBS}/>
        <Scatter dataKey="sell" fill='red' line={true} isAnimationActive={false} data={dataS}/>
        <Scatter dataKey="sellStop" fill='orange' line={true} isAnimationActive={false} data={dataSS}/>

        <Scatter dataKey="buy" fill='blue' line={false} isAnimationActive={false} data={tradeB}/>
        <Scatter dataKey="buyStop" fill='green' line={false} isAnimationActive={false} data={tradeBS}/>        
        <Scatter dataKey="sell" fill='red' line={false} isAnimationActive={false} data={tradeS}/>
        <Scatter dataKey="sellStop" fill='orange' line={false} isAnimationActive={false} data={tradeSS}/>

        <Scatter dataKey="y" fill='gray' line={true} isAnimationActive={false} data={market}/>
        <Scatter dataKey="y" fill='gray' line={true} isAnimationActive={false} data={marketRealtime}/>
        <Area
            dataKey="y"
            fill="#cccccc"
            dot={false}
            stroke="none"
            activeDot={false}
            data={marketLH}
        />
        <Tooltip/>
        <XAxis type='number' dataKey="x" domain={[(dataMin:number) => Math.floor(dataMin-20), (dataMax:number) => Math.ceil(dataMax+20)]}/>
        <YAxis type='number' domain={domainFunc} unit='$'/>
        <ZAxis type="number" range={[0,100]} dataKey="z" />
      </ComposedChart>
    <div>Ticker: <strong>{ ticker }</strong></div>
    <div>DB id: <strong>{ symbol.id }</strong></div>
    <div>IB id: <strong>{ symbol.ib_conid }</strong></div>
    <div> { models.map( model => <div>{ model.model_name } ({ model.db_id })</div> )} </div>
    </div>)
  }
  