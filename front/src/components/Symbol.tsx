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

    let { symbol, date } = useParams();

    // const data = [{x: 100, y: 400}, {x: 400, y: 800}, {x: null, y: NaN}, {x: 300, y: 300}, {x: 500, y: 700},];
    useEffect( () => {
        async function action() {
          const response = await fetch(`/api/symbols/${symbol}/${date}`);
          const itemsResponse = await fetch(`/api/items/${symbol}/${date}`);
          const realtimeResponse = await fetch(`/api/realtime/${symbol}/${date}`);
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
            console.log('orders', json.symbol.orders)
            const dataS = [];
            const dataB = [];
            for (const order of json.symbol.orders) {
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
            console.log(dataB);
            console.log(dataS);
          } else {
            console.log('error')
          }
        }
    
        action().catch(console.error);
      }, [ ]);


    return (
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
    )
  }
  