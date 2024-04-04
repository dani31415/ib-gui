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
import Box from '@mui/material/Box';

function dec(x: number) {
  return Math.round(x*1000)/1000;
}

export default function Report() {
  const [toggle, setToggle] = useState(true);
  const [text, setText] = useState('');
  const [modelSummary, setModelSummary] : [any[], any] = useState([]);
  const [report, setReport] : [any[], any] = useState([]);
  const [taxes, setTaxes] = useState(false);
  const [commissions, setCommissions] = useState(false);
  const navigate = useNavigate();

  const handleCommissionsAndTaxes = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCommissions(event.target.checked);
    setTaxes(event.target.checked);
  };

  function findModelName(models: any[], line: any) : any {
    for (const model of models) {
      if (model.modelName === line.modelName) {
        return model;
      }
    }
    return null
  }

  function setSummary(report: any[]) {
    let models: any[] = []
    let data: any = null;

    for (const line of report) {
      if (data === null || data.modelName !== line.modelName) {
        data = findModelName(models, line);
        if (data == null) {
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
      const response = await fetch(`/api/report?taxes=${taxes}&commissions=${commissions}`);
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
  }, [ toggle, commissions, taxes ]);

  return (<div>
    <FormGroup>
      <Box>
        <FormControlLabel control={<Checkbox checked={commissions && taxes} onChange={handleCommissionsAndTaxes}/>} label="Comissions & taxes" />
      </Box>
    </FormGroup>
    <Table>
      <TableContainer component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>Model</TableCell>
            <TableCell>Gain</TableCell>
            <TableCell>Market</TableCell>
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
            <TableCell>Market</TableCell>
            <TableCell>Sold</TableCell>
            <TableCell>Fail*</TableCell>
            <TableCell>Bad**</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        { report.map( item => (
          <TableRow>
            <TableCell>{ item['date'] }</TableCell>
            <TableCell>{ dec(item['gain']) }</TableCell>
            <TableCell>{ dec(item['marketMean']) }</TableCell>
            { item['count'] == item['total'] - item['discarded'] - item['opening'] ? 
                <TableCell>{ item['count'] }</TableCell> : 
                <TableCell>{ item['count'] }/{ item['total'] - item['discarded'] - item['opening'] }</TableCell>
            }
            <TableCell>{ item['failed'] }</TableCell>
            <TableCell>{ item['discarded'] }</TableCell>
          </TableRow>
        ))}
        </TableBody>
      </TableContainer>
      <span>{ text }</span>
    </Table>
    <div style={ {fontSize: '70%'} }>
    Fail* - Failed due to market reasons. No seller found.
    <br />
    Bad** - Discarded because company does not meet requirements.
    </div>
  </div>);
}