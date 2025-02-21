import { useState, useEffect } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

export default function Train() {
  const [train, setTrain] = useState([]);
  const [process, setProcess] = useState('');
  const [summary, setSummary] = useState([]);
  const [summaryLine, setSummaryLine] = useState<any>({});
  const [text, setText] = useState('');
  const [openSummaryDialog, setOpenSummaryDialog] = useState(false);
  const navigate = useNavigate();

  const ellipsis = {width:'125px', display:'block', textOverflow:'ellipsis', overflow:'hidden'};

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
      const responseSummary = await fetch(`/api/train/summary`);
      const jsonSummary = await responseSummary.json();
      if (json.success) {
        var train: any[] = jsonSummary.summary
        train = order(train)
        setSummary(train as never[]);
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

  function status(t: any) {
    return t['epoch'] + '/' + (t['n_epochs'] ? t['n_epochs']-1 : '');
  }

  function info(t: any) {
    if (t.operation === 'train') {
      return t['running'] ? '(' + t['seconds'] + 's)' : '';
    } else {
      return 'metrics';
    }
  }

  function gpu(t: any) {
    if (t['running'] && 'pid' in t) {
      return 'pid=' + t['pid'];
    } else {
      return '';
    }
  }

  function showSummaryDialog(summaryLine: any) {
    setSummaryLine(summaryLine);
    setOpenSummaryDialog(true);
  }

  function closeSummaryDialog() {
    setOpenSummaryDialog(false);
  }

  function dec3(x: number) {
    const y = Math.round(x*1000)/1000;
    let s = y.toString();
    if (s.length === 1) {
      s += '.';
    }
    while (s.length < 5) {
      s += '0';
    }
    return s;
  }

  function openRow(name: string, period: number) {
    navigate(`/train/${name}/${period}`);
  }

  function dec4(x: number) {
    const y = Math.round(x*10000)/10000;
    let s = y.toString();
    if (s.length === 1) {
      s += '.';
    }
    while (s.length < 6) {
      s += '0';
    }
    return s;
  }

return (<div>
    Process: {process && process.length > 0 ? process:'not running'}
    <Table>
      <TableContainer component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell sx={ellipsis}>Name Period</TableCell>
            <TableCell>Best</TableCell>
            <TableCell>Mean</TableCell>
            <TableCell>Market</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        { summary.map( t => (
          <TableRow onClick={() => showSummaryDialog(t)}>
            <TableCell sx={ellipsis}>{ t['name'] }<br></br>{ t['min_period'] }-{ t['max_period'] }</TableCell>
            <TableCell>{ dec4(t['real']) }</TableCell>
            <TableCell>{ dec4(t['mean_best']) }</TableCell>
            <TableCell>{ dec4(t['interday_market']) }</TableCell>
          </TableRow>
        ))}
        </TableBody>
      </TableContainer>
    </Table>
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
          <TableRow hover onClick={() => openRow(t['name']+t['variant']+'-'+t['iteration'], t['end_period'])}>
            <TableCell sx={style(t)}>{ t['name'] }<br></br>{t['end_period']} {t['variant']}-{t['iteration']}</TableCell>
            <TableCell  sx={style(t)}>{ t['modified'] ?? ''}</TableCell>
            <TableCell  sx={style(t)}>{ status(t) }<br></br>{ info(t) }<br></br>{ gpu(t) } </TableCell>
          </TableRow>
        ))}
        </TableBody>
      </TableContainer>
    </Table>
    <span>{ text }</span>
    <Dialog
        open={openSummaryDialog}
        onClose={ closeSummaryDialog }
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{ summaryLine.name }</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <p>
              Epoch range: { summaryLine.epoch_start}-{ summaryLine.epoch_end}
            </p>
            <Table>
              <TableContainer>
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell>Real</TableCell>
                    <TableCell>Best</TableCell>
                    <TableCell>Mean</TableCell>
                    <TableCell>Market</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                { summaryLine.best_best_list && Object.keys(summaryLine.best_best_list).map( x => (
                  <TableRow>
                    <TableCell>{x}</TableCell>
                    <TableCell>{dec3(summaryLine.real_list[x])}</TableCell>
                    <TableCell>{dec3(summaryLine.best_best_list[x])}</TableCell>
                    <TableCell>{dec3(summaryLine.mean_best_list[x])}</TableCell>
                    <TableCell>{dec3(summaryLine.interday_market_list[x])}</TableCell>
                  </TableRow>
                ))}
                </TableBody>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{fontWeight:'bold'}}>Total</TableCell>
                    <TableCell sx={{fontWeight:'bold'}}>{dec3(summaryLine.real)}</TableCell>
                    <TableCell sx={{fontWeight:'bold'}}>{dec3(summaryLine.best_best)}</TableCell>
                    <TableCell sx={{fontWeight:'bold'}}>{dec3(summaryLine.mean_best)}</TableCell>
                    <TableCell sx={{fontWeight:'bold'}}>{dec3(summaryLine.interday_market)}</TableCell>
                  </TableRow>
                </TableHead>
              </TableContainer>
            </Table>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSummaryDialog} autoFocus>Ok</Button>
        </DialogActions>
      </Dialog>
   </div>)
}