import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Scatter, Line, CartesianGrid, XAxis, YAxis, ZAxis, ScatterChart } from 'recharts';


function round2(x: number): number {
    return Math.round(x*100)/100;
}

export default function Symbol() {
    const [dataS, setDataS] : [any[], any] = useState([]);
    const [dataB, setDataB] : [any[], any] = useState([]);

    let { symbol, date } = useParams();

    // const data = [{x: 100, y: 400}, {x: 400, y: 800}, {x: null, y: NaN}, {x: 300, y: 300}, {x: 500, y: 700},];
    useEffect( () => {
        async function action() {
          let response;
          response = await fetch(`/api/symbols/${symbol}/${date}`);
          const json = await response.json();
          if (json.success) {
            const dataS = [];
            const dataB = [];
            for (const order of json.symbol.orders) {
                let p: any = {
                    x: round2(order.minute),
                    y: round2(order.price),
                }
                if (order.side == 'S') {
                    dataS.push(p);
                } else {
                    dataB.push(p);
                }

                if (order.status=='closed') {
                    p = {
                        x: NaN,
                        y: NaN,
                    }
                    if (order.side == 'S') {
                        dataS.push(p);
                    } else {
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
      <ScatterChart width={1200} height={300}>
        <Scatter dataKey="y" fill='red' line={true} isAnimationActive={false} data={dataS}/>
        <Scatter dataKey="y" fill='blue' line={true} isAnimationActive={false} data={dataB}/>
        <CartesianGrid stroke="#ccc" />
        <XAxis type='number' dataKey="x" />
        <YAxis type='number' dataKey="y"/>
        <ZAxis type="number" range={[20]} />
      </ScatterChart>
    )
  }
  