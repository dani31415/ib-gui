import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

export default function Position() {
  const [toggle, setToggle] = useState(true);
  const [closeDisabled, setCloseDisabled] = useState(false);
  const [text, setText] = useState('');
  const [position, setPosition] = useState(null);
  const [orders, setOrders] = useState([]);
  const [info, setInfo] = useState(null);
  const navigate = useNavigate();
  const [openClosePositionDialog, setOpenClosePositionDialog] = useState(false);

  let { id } = useParams();

  useEffect( () => {
    async function action() {
      const responseOrder = await fetch(`/api/internal/orders/${id}`);
      const jsonOrders = await responseOrder.json();
      const response = await fetch(`/api/positions/${id}`);
      const json = await response.json();
      if (json.success) {
        console.log(json, jsonOrders)
        setPosition(json.position);
        setOrders(jsonOrders.orders);
        action2().catch(console.error);
      } else {
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
    async function action2() {
        const response = await fetch(`/api/conidinfo/${id}`);
        const json = await response.json();
        if (json.success) {
          setInfo(json.info);
        } else {
          setText(json.error);
        }
      }
      action().catch(console.error);
  }, [ toggle ]);

  async function closePosition() {
    setOpenClosePositionDialog(true);
  }

  async function handleClosePositionDialog() {
    setOpenClosePositionDialog(false);
    setCloseDisabled(true);
    const response = await fetch(`/api/positions/${id}/close`);
    const json = await response.json();
    if (json.success) {
        setText(`closed ${json.orderId}`);
    }
    setCloseDisabled(false);
  }

  function closeClosePositionDialog() {
    setOpenClosePositionDialog(false)
  }

  return (
    <div>
      <div>Name: { position && position['ticker'] }</div>
      <div>Conid: { position && position['conid'] }</div>
      <div>Position: { position && position['position'] }</div>
      <div>Market value: { position && position['mktValue'] }</div>
      <div>Orders: { position && orders.length }</div>
      <div>Last price: { info && info['lastPrice'] }</div>
      <div>Bid price: { info && info['bidPrice'] }</div>
      <div>Ask price: { info && info['askPrice'] }</div>
      <div>Today volume: { info && info['todayVolume'] }</div>
      <div>Volume: { info && info['volume'] }</div>
      <div>Open price: { info && ('openPrice' in info ? info['openPrice']:'closed') }</div>
      <Button disabled={ closeDisabled } variant="outlined" onClick={ closePosition }>Close</Button>
      <div>{ text }</div>
      <Dialog
        open={openClosePositionDialog}
        onClose={ closeClosePositionDialog }
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirmation required</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Do you accept to close (sell) the position?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeClosePositionDialog} autoFocus>Cancel</Button>
          <Button onClick={handleClosePositionDialog}>Ok</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
