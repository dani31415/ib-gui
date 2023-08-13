import { useState, useEffect } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

export default function Train() {
  const [train, setTrain] = useState([]);
  const [process, setProcess] = useState('');
  const [text, setText] = useState('');


  function order(train: any[]): any[] {
    const r: any[] = []
    for (const t of train) {
      if (!t.finished) {
        r.push(t);
      }
    }
    for (const t of train) {
      if (t.finished) {
        r.push(t);
      }
    }
    return r;
  }

  function style(x: any) {
    if (x['running'])
        return { color: 'FireBrick' };
    else if (x['finished'])
        return { color: 'gray' };
    else
        return {};
  }

  useEffect( () => {
    async function action() {
      const response = await fetch(`/api/train`);
      const json = await response.json();
      if (json.success) {
        var train: any[] = json.train
        train = order(train)
        setTrain(train as never[]);
      } else {
        setText(json.error);
      }
      const responseProcess = await fetch(`/api/train/process`);
      const jsonProcess = await responseProcess.json();
      if (json.success) {
        setProcess(jsonProcess.train);
      } else {
        setText(json.error);
      }
    }

    action().catch(console.error);
  }, [ ]);

  return (<div>
    Process: {process && process.length > 0 ? process:'not running'}
    <Table>
      <TableContainer component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>Name Period</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Epoch</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        { train.map( t => (
          <TableRow>
            <TableCell sx={style(t)}>{ t['name'] }<br></br>{t['end_period']} {t['variant']}-{t['iteration']}</TableCell>
            <TableCell  sx={style(t)}>{ t['modified'] ?? ''}</TableCell>
            <TableCell  sx={style(t)}>{ t['epoch'] }/{ t['n_epochs'] ? t['n_epochs']-1:'' }<br></br>{t['running'] ? '(' + t['seconds'] + 's)':''} </TableCell>
          </TableRow>
        ))}
        </TableBody>
      </TableContainer>
      <span>{ text }</span>
    </Table>

  </div>)
}