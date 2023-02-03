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
  const [modelSummary, setModelSummary] : [any[], any] = useState([]);
  const [report, setReport] : [any[], any] = useState([]);
  const navigate = useNavigate();

  function setSummary(report: any[]) {
    let models: any[] = []
    let data: any = null;

    for (const line of report) {
      if (data === null || data.modelName !== line.modelName) {
        data = {
          modelName: line.modelName,
          mean: 0,
          gain: 0,
          nMean: 0,
          nGain: 0,
          nDays: 0,
        }
        models.push(data);
      }
      if (line.marketMean > 0) {
        data.mean += line.count * line.marketMean;
        data.nMean += line.count;
      }
      if (line.gain > 0) {
        data.gain += line.count * line.gain;
        data.nGain += line.count;
      }
      data.nDays += 1;
      data.date = line.date;
    }
    for (const data of models) {
        data.gain = data.gain / data.nGain;
        data.mean = data.mean / data.nMean;
    }
    // setModelSummary([models[0]]);
    setModelSummary([models[0], models[1], models[2]]);
  }

  useEffect( () => {
    async function action() {
      const response = await fetch(`/api/report`);
      const json = await response.json();
      if (json.success) {
        setReport(json.report);
        setSummary(json.report);
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

  return (<div>
    <Table>
      <TableContainer component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>Model</TableCell>
            <TableCell>Gain</TableCell>
            <TableCell>Mean</TableCell>
            <TableCell>From</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        { modelSummary.map( item => (
          <TableRow>
            <TableCell style={ {fontSize:'70%'} }>{ item.modelName }</TableCell>
            <TableCell>{ dec(item.gain) }</TableCell>
            <TableCell>{ dec(item.mean) }</TableCell>
            <TableCell>{ item.date }</TableCell>
          </TableRow>
        ))}
        </TableBody>
      </TableContainer>
      <span>{ text }</span>
    </Table>
    <br />
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
  </div>);
}