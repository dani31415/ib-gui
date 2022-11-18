import WarningIcon from '@mui/icons-material/Warning';
import CheckBox from '@mui/icons-material/CheckBox';
import CircularProgress from '@mui/material/CircularProgress';
import Error from '@mui/icons-material/Error';
import { green, orange, red } from '@mui/material/colors';

export default function PositionStatus({status}: any) {
  return ( <span> {
      (status === 'ok' ? <CheckBox sx={{ color: green[500] }} /> : false)
        ||
      (status === 'error' ? <Error sx={{ color: red[500] }} /> : false)
        ||
      (status === 'warning' ? <WarningIcon sx={{ color: orange[500] }} /> : false)
        ||
      (status === 'checking' ? <CircularProgress size='20px'/> : false)
        ||
      (<span></span>)
  }</span> );
}
