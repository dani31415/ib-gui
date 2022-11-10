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
      const response = await fetch("/api/positions");
      const json = await response.json();
      if (json.success) {
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

return (
    <Table>
      <TableContainer component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>Symbol</TableCell>
            <TableCell>#</TableCell>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        { positions.filter( p => p['position']>0 ).map( position => (
          <TableRow hover onClick={() => openRow(position['conid'])}>
            <TableCell>{ position['contractDesc'] }</TableCell>
            <TableCell>{ position['position'] }</TableCell>
            <TableCell>{ position['mktValue'] }</TableCell>
            <TableCell><PositionStatus position={ position }/></TableCell>
          </TableRow>
        ))}
        </TableBody>
      </TableContainer>
      <span>{ text }</span>
    </Table>
  )
}
