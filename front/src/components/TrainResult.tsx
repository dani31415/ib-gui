import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

function dec5(x: number) {
    const y = Math.round(x*100000)/100000;
    let s = y.toString();
    if (s.length === 1) {
      s += '.';
    }
    while (s.length < 7) {
      s += '0';
    }
    return s;
}

export default function TrainResult() {    
    const [source, setSource] : [string, any] = useState('/api/static/blank.png');
    const [result, setResult] : [any, any] = useState(null);

    let { name, period } = useParams();


    useEffect( () => {
        async function action() {
          const response = await fetch(`/api/train/result?name=${name}&period=${period}`);
          const json = await response.json();
          console.log(json);
          const random = Math.random();
          setSource(`/api/static/fig.png?${random}`);
          console.log(json.result[0].metrics)
          setResult(json);
          
        }
    
        action().catch(console.error);
      }, [  ]);

      return (
        <div>
            <TableContainer component={Paper}>
                <TableHead>
                <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell></TableCell>
                    <TableCell>val</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                { result && result.result[0].metrics.map( (key:any) => (
                <TableRow>
                    <TableCell>{ key[0] }</TableCell>
                    <TableCell>{ dec5(key[1]) }</TableCell>
                    <TableCell>{ dec5(key[2]) }</TableCell>
                </TableRow>
                ))}
                </TableBody>
            </TableContainer>
            <img src={source} />
        </div>
    );
}
