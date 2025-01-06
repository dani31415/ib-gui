import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';

export default function Positions() {
  const [toggle, setToggle] = useState(true);
  const [submittedOrders, setSubmittedOrders] = useState<any[]>([]);
  const [filledOrders, setFilledOrders] = useState<any[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<any[]>([]);
  const [text, setText] = useState('');
  const navigate = useNavigate();

  useEffect( () => {
    async function action() {
      const response = await fetch("/api/orders");
      const json = await response.json();
      if (json.success) {
        setOrders(json.orders);
      } else {
        if (json?.error === 'Unauthorized') {
          navigate('/sso/Login?forwardTo=22&RL=1&ip2loc=US');
          navigate(0); // refresh since /sso is outside the control of react
        } else if (json?.error === 'Unauthenticated') {
          setText('Authenticating...');
          const result = await fetch("/api/ib/reauthenticate");
          if (result.status === 200) {
            setToggle(!toggle);
          } else {
            setText('Failed!');
          }
        } else {
          setText(json.error);
        }
      }
    }
    action().catch(console.error);
  }, [ toggle ]);

  function openRow(id: number) {
    navigate(`/orders/${id}`);
  }

  function setOrders(orders: any[]) {
    const filledOrders: any[] = [];
    const submittedOrders: any[] = [];
    const cancelledOrders: any[] = [];
    for (const order of orders) {
      if (order.status == 'Submitted' || order.status == 'PreSubmitted') {
        submittedOrders.push(order);
      } else if (order.status == 'Filled') {
        filledOrders.push(order)
      } else {
        cancelledOrders.push(order)
      }
    }
    setFilledOrders(filledOrders);
    setSubmittedOrders(submittedOrders);
    setCancelledOrders(cancelledOrders);
  }

  return (
    <span>
      <TableContainer component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>Side</TableCell>
            <TableCell>Symbol</TableCell>
            <TableCell>Filled</TableCell>
            <TableCell>Remain</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell colSpan={5}>Pending</TableCell>
          </TableRow>
        { submittedOrders.map( order => (
          <TableRow hover onClick={() => openRow(order['orderId'])}>
            <TableCell>{ order['side'] }</TableCell>
            <TableCell>{ order['ticker'] }</TableCell>
            <TableCell>{ order['filledQuantity'] }</TableCell>
            <TableCell>{ order['remainingQuantity'] }</TableCell>
            <TableCell>{ order['status'] }</TableCell>
          </TableRow>
        ))}
        </TableBody>
        <Divider orientation="vertical" flexItem />
        <TableBody>
          <TableRow>
            <TableCell colSpan={5}>Filled</TableCell>
          </TableRow>
        { filledOrders.map( order => (
          <TableRow hover onClick={() => openRow(order['orderId'])}>
            <TableCell>{ order['side'] }</TableCell>
            <TableCell>{ order['ticker'] }</TableCell>
            <TableCell>{ order['filledQuantity'] }</TableCell>
            <TableCell>{ order['remainingQuantity'] }</TableCell>
            <TableCell>{ order['status'] }</TableCell>
          </TableRow>
        ))}
        </TableBody>
        <TableBody>
          <TableRow>
            <TableCell colSpan={5}>Cancelled</TableCell>
          </TableRow>
        { cancelledOrders.map( order => (
        <TableRow hover onClick={() => openRow(order['orderId'])}>
            <TableCell>{ order['side'] }</TableCell>
            <TableCell>{ order['ticker'] }</TableCell>
            <TableCell>{ order['filledQuantity'] }</TableCell>
            <TableCell>{ order['remainingQuantity'] }</TableCell>
            <TableCell>{ order['status'] }</TableCell>
          </TableRow>
        ))}
        </TableBody>
      </TableContainer>
      <span>{ text }</span>
    </span>
  )
}
