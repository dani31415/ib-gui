import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';

export function OrderSummary() {
    const [text, setText] = useState('?');
    const [toggle, setToggle] = useState(true);
    const [purchasing, setPurchasing] = useState(0);
    const [selling, setSelling] = useState(0);
    const [purchased, setPurchased] = useState(0);
    const [sold, setSold] = useState(0);
    const [cancelled, setCancelled] = useState(0);
    const navigate = useNavigate();

    function setOrders(orders: any[]) {
        let purchasing = 0
        let selling = 0;
        let purchased = 0
        let sold = 0;
        let cancelled = 0;
        for (const order of orders) {
          if (order.status == 'Submitted' || order.status == 'PreSubmitted') {
            if (order.side == 'BUY') {
                purchasing  += 1;
            }
            if (order.side == 'SELL') {
                selling  += 1;
            }
          } else if (order.status == 'Filled') {
            if (order.side == 'BUY') {
                purchased  += 1;
            }
            if (order.side == 'SELL') {
                sold += 1;
            }
          } else {
            cancelled += 1;
          }
        }
        setPurchasing(purchasing);
        setSelling(selling);
        setSold(sold);
        setPurchased(purchased);
        setCancelled(cancelled);
    }
  
    useEffect( () => {
      setText('?');
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
    
    return (
      <TableContainer className="OrderSummary">
        <TableBody>
            <TableRow>
                <TableCell>Purchasing</TableCell>
                <TableCell>{ purchasing }</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>Selling</TableCell>
                <TableCell>{ selling }</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>Purchased</TableCell>
                <TableCell>{ purchased }</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>Sold</TableCell>
                <TableCell>{ sold }</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>Cancelled</TableCell>
                <TableCell>{ cancelled }</TableCell>
            </TableRow>
        </TableBody>
      </TableContainer>
    );
  }

  export default OrderSummary;