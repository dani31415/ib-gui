import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

export default function Simulation() {
  const [toggle, setToggle] = useState(true);
  const [simulation, setSimulation] : [any[], any] = useState([]);
  const [total, setTotal] = useState({total:0, market:0});
  const [text, setText] = useState('');
  const navigate = useNavigate();
  const [commissions, setCommissions] = useState(false);
  const [detail, setDetail] = useState(false);
  const [nDays, setNDays] = useState(false);

  const handleCommissions = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCommissions(event.target.checked);
  };

  const handleDetail = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDetail(event.target.checked);
  };

  const handleNDays = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNDays(event.target.checked);
  };

  function dec(x: number) {
    return Math.round(x*1000)/1000;
  }

  function setSummary(array: any[]) {
    let accum = 0;
    let market = 0;
    let n = 0;
    for (const item of array) {
      if (item.modelName === 'n010_10_1_2_10_800_prod') {
      // if (item.modelName === 'm188_prod') {
        if (item.actualBeforeCompissions && item.market) {
          let w = 1;
          if (item.date.startsWith('2022-11-25')) {
            w = 0.2;
          }
          n += w;
          accum += w * (item.actualBeforeCompissions / item.market);
          market += w * item.market;
        }
      }
    }
    setTotal({total: accum/n, market: market/n});
  }

  useEffect( () => {
    async function action() {
      let response;
      if (nDays) {
        response = await fetch("/api/simulation2");
      } else {
        response = await fetch("/api/simulation");
      }
      const json = await response.json();
      if (json.success) {
        setSimulation(json.simulation);
        setSummary(json.simulation);
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
  }, [ toggle, nDays ]);

  function formatDate(str: string) {
    if (str==null) return '';
    const i = str.indexOf('T');
    return str.substring(0, i);
  }

  return (
    <div>
    <FormGroup>
      <FormControlLabel control={<Checkbox checked={nDays} onChange={handleNDays}/>} label="4 days" />
      <FormControlLabel control={<Checkbox checked={commissions} onChange={handleCommissions}/>} label="Commissions" />
      <FormControlLabel control={<Checkbox checked={detail} onChange={handleDetail}/>} label="Detail" />
    </FormGroup>
    Summary: <span style={{fontWeight: 'bold'}}>{ dec(total.total) }</span> + { dec(total.market) }
    <Table>
      <TableContainer component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Sim</TableCell>
            {detail && <TableCell>Open*</TableCell>}
            {detail && <TableCell>Start*</TableCell>}
            {detail && <TableCell>Last*</TableCell>}
            {detail && <TableCell>Ask*</TableCell>}
            <TableCell>Actual</TableCell>
            <TableCell>Market</TableCell>
            {detail && <TableCell>Model</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
        { simulation.map( item => (
          <TableRow>
            <TableCell>{ formatDate(item['date']) }</TableCell>
            <TableCell>{ dec(item['simulation']) }</TableCell>
            {detail && <TableCell>{ dec(item['actualAtOpen']) }</TableCell>}
            {detail && <TableCell>{ dec(item['actualAtOrder']) }</TableCell>}
            {detail && <TableCell style={{fontWeight: 'bold'}}>{ dec(item['actualAtBuy']) }</TableCell>}
            {detail && <TableCell>{ dec(item['askAtBuy']) }</TableCell>}
            <TableCell style={{fontWeight: 'bold'}}>{ commissions ? dec(item['actual']):dec(item['actualBeforeCompissions']) }</TableCell>
            <TableCell>{ dec(item['market']) }</TableCell>
            {detail && <TableCell>{ item['modelName'] }</TableCell>}
          </TableRow>
        ))}
        </TableBody>
      </TableContainer>
      {detail && <span>* From the selected symbols at order time.</span>}
      <span>{ text }</span>
    </Table>
    </div>
  )
}
