import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';

function round2(x: number|null): number|null {
    if (x===null) {
        return null;
    }
    return Math.round(x*10000)/10000;
}

export default function Day() {
    const [orders, setOrders] : [any[], any] = useState([]);
    const navigate = useNavigate();
    let [searchParams, setSearchParams] = useSearchParams();

    let { date } = useParams();


    function openRow(id: string) {
      navigate(`/days/${date}/symbols/${id}?model=${searchParams.get('model')}`);
    }

    // const data = [{x: 100, y: 400}, {x: 400, y: 800}, {x: null, y: NaN}, {x: 300, y: 300}, {x: 500, y: 700},];
    useEffect( () => {
        async function action() {
          let response;
          response = await fetch(`/api/days/${date}?model=${searchParams.get('model')}`);
          const json = await response.json();
          if (json.success) {
            console.log(json.day);
            setOrders(json.day.orders);
          } else {
            console.log('error')
          }
        }
    
        action().catch(console.error);
      }, [ ]);

    return (
        <TableContainer component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>#</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>#</TableCell>
            <TableCell>Gains1</TableCell>
            <TableCell>Gains2</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        { orders.map( order => (
          <TableRow hover onClick={() => openRow(order['name'])}>
            <TableCell>{ order['name'] }</TableCell>
            <TableCell>{ order['count'] }</TableCell>
            <TableCell>{ round2(order['buy_order_price']) }</TableCell>
            <TableCell>{ order['bought_quantity'] }</TableCell>
            <TableCell>{ round2(order['gains1']) }</TableCell>
            <TableCell>{ round2(order['gains2']) }</TableCell>
          </TableRow>
        ))}
        </TableBody>
      </TableContainer>
    )
  }
  