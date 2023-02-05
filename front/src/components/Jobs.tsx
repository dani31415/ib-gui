import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Error from '@mui/icons-material/Error';
import CheckBox from '@mui/icons-material/CheckBox';
import CircularProgress from '@mui/material/CircularProgress';
import WarningIcon from '@mui/icons-material/Warning';
import { green, red, grey } from '@mui/material/colors';
import JobsSuccessDate from './JobSuccessDate';

export default function Jobs() {
  const [toggle, setToggle] = useState(true);
  const [text, setText] = useState('');
  const [jobs, setJobs] : [any[], any] = useState([]);
  const navigate = useNavigate();

  useEffect( () => {
    async function action() {
      const response = await fetch('/api/jenkins/jobs');
      const json = await response.json();
      if (json.success) {
        setJobs(json.jobs);
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
            <TableCell>Name</TableCell>
            <TableCell>Color</TableCell>
            <TableCell>Success</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
        { jobs.map( item => (
          <TableRow>
            <TableCell>{ item.name }</TableCell>
            <TableCell>
                { item.color === 'red' ? <Error sx={{ color: red[500] }} /> : '' }
                { item.color === 'blue' ? <CheckBox sx={{ color: green[500] }} /> : '' }
                { item.color === 'disabled' ? <WarningIcon sx={{ color: grey[500] }} /> : '' }
                { item.color.indexOf('_anime') >= 0 ?  <CircularProgress size='20px'/> : '' }
            </TableCell>
            <TableCell><JobsSuccessDate name={ item.name } /></TableCell>
          </TableRow>
        ))}
        </TableBody>
      </TableContainer>
      <span>{ text }</span>
    </Table>
 </div>);
}