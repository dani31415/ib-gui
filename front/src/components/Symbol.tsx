import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Area, Scatter, CartesianGrid, XAxis, YAxis, ZAxis, ComposedChart, Tooltip } from 'recharts';

function round2(x: number): number {
    return Math.round(x*100)/100;
}

function domainFunc( [m, M] : [number, number], allowedDataOverflow: boolean): [number, number] {
    const d = M-m;
    return [Math.floor(m-0.1*d),Math.ceil(M+0.1*d)];
}

export default function Symbol() {
    const [dataS, setDataS] : [any[], any] = useState([]);
    const [dataB, setDataB] : [any[], any] = useState([]);
    const [market, setMarket] : [any[], any] = useState([]);
    const [marketLH, setMarketLH] : [any[], any] = useState([]);
    const [marketRealtime, setMarketRealtime] : [any[], any] = useState([]);
    const [symbol, setSymbol] : [any, any] = useState({});
    const [models, setModels] : [string[], any] = useState([]);

    let { ticker, date } = useParams();

    // const data = [{x: 100, y: 400}, {x: 400, y: 800}, {x: null, y: NaN}, {x: 300, y: 300}, {x: 500, y: 700},];
    useEffect( () => {
        async function action() {
          const response = await fetch(`/api/symbols/${ticker}/${date}`);
          const itemsResponse = await fetch(`/api/items/${ticker}/${date}`);
          const realtimeResponse = await fetch(`/api/realtime/${ticker}/${date}`);
          const json = await response.json();
          const items = await itemsResponse.json();
          const realtime = await realtimeResponse.json();
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
            const dataB = [];
            for (const order of json.symbol.orders) {
                var model_name = order.model_name;
                let p: any = {
                    x: round2(order.minute),
                    z: order.remaining != order.quantity ? 100:0,
                }
                if (order.side == 'S') {
                    p.sell = round2(order.price)
                    dataS.push(p);
                } else {
                    p.buy = round2(order.price)
                    dataB.push(p);
                }

                if (order.status=='closed') {
                    p = {
                        x: NaN,
                        z: NaN,
                    }
                    if (order.side == 'S') {
                        models.push(model_name);
                        p.sell = NaN;
                        dataS.push(p);
                    } else {
                        p.buy = NaN;
                        dataB.push(p);
                    }
                }
            }
            setDataB(dataB);
            setDataS(dataS);
            setModels(models);
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
        <Scatter dataKey="sell" fill='red' line={true} isAnimationActive={false} data={dataS}/>
        <Scatter dataKey="buy" fill='blue' line={true} isAnimationActive={false} data={dataB}/>
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
    <div> { models.map( model => <div>{ model }</div> )} </div>
    </div>)
  }
  