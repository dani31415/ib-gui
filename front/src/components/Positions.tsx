import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import PositionStatus from './PositionStatus';

export default function Positions() {
  const [toggle, setToggle] = useState(true);
  const [positions, setPositions] : [any[], any] = useState([]);
  const [text, setText] = useState('');
  const navigate = useNavigate();

  useEffect( () => {
    async function action() {
      const response = await fetch("/api/positions2");
      const json = await response.json();
      if (json.success) {
        for (const position of json.positions) {
          position['computedStatus'] = computeStatus(position)
        }
        setPositions(json.positions);
      } else {
        console.log('error')
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
    navigate(`/positions/${id}`);
  }

  function computeStatus(position: any) {
    let error = false;
    let pending = false;
    if (position.internal.length>0) {
      let quantity = 0;
      for (let order of position.internal) {
        console.log(order);
        if (order.shortName !== position.shortName) {
          error = true;
        }
        if (order.status !== 'open') {
          pending = true;
        }
        quantity += order.quantity;
      }
      if (position.quantity !== quantity) {
        pending = true;
      }
    } else {
      error = true;
    }

    if (error) {
      return 'error';
    } else if (pending) {
      return 'warning';
    }
    return 'ok';
  }

  function formatDate(str: string) {
    const i = str.indexOf('T');
    return str.substring(0, i);
  }

  return (
    <Table>
      <TableContainer component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>Symbol</TableCell>
            <TableCell>Value</TableCell>
            <TableCell>&Delta;</TableCell>
            <TableCell>Date</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        { positions.filter( p => p['quantity']>0 ).map( position => (
          <TableRow hover onClick={() => openRow(position['conid'])}>
            <TableCell>{ position['shortName'] }</TableCell>
            <TableCell>{ position['mktValue'] }</TableCell>
            <TableCell style={{color: position['pnl']>0 ? '#12ad2b' : '#c11b17'}}>{ position['pnl'] }</TableCell>
            <TableCell>{ formatDate(position['lastUpdatedAt']) }</TableCell>
            <TableCell><PositionStatus status={ position['computedStatus'] }/></TableCell>
          </TableRow>
        ))}
        </TableBody>
      </TableContainer>
      <span>{ text }</span>
    </Table>
  )
}
