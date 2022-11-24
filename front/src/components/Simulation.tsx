import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

export default function Simulation() {
  const [toggle, setToggle] = useState(true);
  const [simulation, setSimulation] : [any[], any] = useState([]);
  const [text, setText] = useState('');
  const navigate = useNavigate();

  function dec(x: number) {
    return Math.round(x*1000)/1000;
  }

  useEffect( () => {
    async function action() {
      const response = await fetch("/api/simulation");
      const json = await response.json();
      if (json.success) {
        setSimulation(json.simulation);
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

  function formatDate(str: string) {
    if (str==null) return '';
    const i = str.indexOf('T');
    return str.substring(0, i);
  }

  return (
    <Table>
      <TableContainer component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Sim</TableCell>
            <TableCell>At open</TableCell>
            <TableCell>At buy</TableCell>
            <TableCell>Actual</TableCell>
            <TableCell>Market</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        { simulation.map( item => (
          <TableRow>
            <TableCell>{ formatDate(item['date']) }</TableCell>
            <TableCell>{ dec(item['simulation']) }</TableCell>
            <TableCell>{ dec(item['actualAtOpen']) }</TableCell>
            <TableCell>{ dec(item['actualAtBuy']) }</TableCell>
            <TableCell>{ dec(item['actual']) }</TableCell>
            <TableCell>{ dec(item['market']) }</TableCell>
          </TableRow>
        ))}
        </TableBody>
      </TableContainer>
      <span>{ text }</span>
    </Table>
  )
}
