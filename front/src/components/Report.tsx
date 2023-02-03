import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

function dec(x: number) {
  return Math.round(x*1000)/1000;
}

  export default function Report() {
    const [toggle, setToggle] = useState(true);
    const [text, setText] = useState('');
    const [report, setReport] : [any[], any] = useState([]);
    const navigate = useNavigate();

    useEffect( () => {
        async function action() {
          const response = await fetch(`/api/report`);
          const json = await response.json();
          if (json.success) {
            setReport(json.report);
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
    return (
      <Table>
      <TableContainer component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Gain</TableCell>
            <TableCell>Mean</TableCell>
            <TableCell>Count</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        { report.map( item => (
          <TableRow>
            <TableCell>{ item['date'] }</TableCell>
            <TableCell>{ dec(item['gain']) }</TableCell>
            <TableCell>{ dec(item['marketMean']) }</TableCell>
            <TableCell>{ item['count'] }</TableCell>
          </TableRow>
        ))}
        </TableBody>
      </TableContainer>
      <span>{ text }</span>
    </Table>
  );
}