import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';

function round2(x: number): number {
    return Math.round(x*1000)/1000;
}

export default function Day() {
    const [orders, setOrders] : [any[], any] = useState([]);
    const navigate = useNavigate();

    let { date } = useParams();

    function openRow(id: string) {
      navigate(`/days/${date}/symbols/${id}`);
    }

    // const data = [{x: 100, y: 400}, {x: 400, y: 800}, {x: null, y: NaN}, {x: 300, y: 300}, {x: 500, y: 700},];
    useEffect( () => {
        async function action() {
          let response;
          response = await fetch(`/api/days/${date}`);
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
            <TableCell>Count</TableCell>
            <TableCell>Gains1</TableCell>
            <TableCell>Gains2</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        { orders.map( order => (
          <TableRow hover onClick={() => openRow(order['name'])}>
            <TableCell>{ order['name'] }</TableCell>
            <TableCell>{ order['count'] }</TableCell>
            <TableCell>{ order['gains1'] }</TableCell>
            <TableCell>{ order['gains2'] }</TableCell>
          </TableRow>
        ))}
        </TableBody>
      </TableContainer>
    )
  }
  