import { useState, useEffect } from 'react';

import WarningIcon from '@mui/icons-material/Warning';
import CheckBox from '@mui/icons-material/CheckBox';
import CircularProgress from '@mui/material/CircularProgress';
import Error from '@mui/icons-material/Error';
import { green, orange, red } from '@mui/material/colors';

export default function PositionStatus({position}: any) {
  const [status, setStatus] = useState('checking');
  const [text, setText] = useState('');

  useEffect( () => {
    async function action() {
      const response = await fetch(`/api/internal/orders/${position.conid}`);
      const json = await response.json();
      if (json.success) {
        let error = false;
        let pending = false;
        if (json.orders.length>0) {
          let quantity = 0;
          for (let order of json.orders) {
            if (order.symbol.shortName !== position['contractDesc']) {
              error = true;
            }
            if (order.status !== 'open') {
              pending = true;
            }
            quantity += order.quantity;
          }
          if (position['position'] !== quantity) {
            pending = true;
          }
        } else {
          error = true;
        }

        if (error) {
          setStatus('error');
        } else if (pending) {
          setStatus('warning');
        } else {
          setStatus('ok');
        }
      } else {
        setText(json.error);
      }
    }

    action().catch(console.error);
  }, [ ]);

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
  } { text } </span> );
}
