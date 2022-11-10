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
  const [order, setOrder] = useState(null);
  const [info, setInfo] = useState(null);
  const navigate = useNavigate();
  const [openCancelOrderDialog, setOpenCancelOrderDialog] = useState(false);

  let { id } = useParams();

  useEffect( () => {
    async function action() {
      const responseOrder = await fetch(`/api/internal/orders/${id}`);
      const jsonOrders = await responseOrder.json();
      const response = await fetch(`/api/orders/${id}`);
      const json = await response.json();
      if (json.success) {
        console.log(json, jsonOrders)
        setOrder(json.order);
        setOrders(jsonOrders.orders);
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
    action().catch(console.error);
  }, [ toggle ]);

  useEffect( () => {
    async function action() {
      if (order) {
        const response = await fetch(`/api/conidinfo/${order!['conidex']}`);
        const json = await response.json();
        if (json.success) {
          setInfo(json.info);
        } else {
          setText(json.error);
        }
      }
    }
    action().catch(console.error);
  }, [ order ]);
    
  async function closePosition() {
    setOpenCancelOrderDialog(true);
  }

  async function handleCancelOrderDialog() {
    setOpenCancelOrderDialog(false);
    setCloseDisabled(true);
    // const response = await fetch(`/api/positions/${id}/close`);
    // const json = await response.json();
    // if (json.success) {
    //     setText(`closed ${json.orderId}`);
    // }
    setCloseDisabled(false);
  }

  function closeCancelOrderDialog() {
    setOpenCancelOrderDialog(false)
  }

  return (
    <div>
      <div>Name: { order && order['symbol'] }</div>
      <div>Conid: { order && order['conid'] }</div>
      <div>Status: { order && order['order_status'] }</div>
      <div>Side: { order && order['side'] === 'B' ? 'BUY' : 'SELL' }</div>
      <div>Size: { order && order['size'] }</div>
      <div>Total size: { order && order['total_size'] }</div>
      <div>Limit price: { order && order['limit_price'] }</div>
      <div>Size and fills { order && order['size_and_fills'] }</div>
      <div>Last price: { info && info['lastPrice'] }</div>
      <div>Bid price: { info && info['bidPrice'] }</div>
      <div>Ask price: { info && info['askPrice'] }</div>
      <div>Volume: { info && info['volume'] }</div>
      <div>Open price: { info && ('openPrice' in info ? info['askPrice']:'closed') }</div>
      <Button disabled={ closeDisabled } variant="outlined" onClick={ closePosition }>Cancel</Button>
      <div>{ text }</div>
      <Dialog
        open={openCancelOrderDialog}
        onClose={ closeCancelOrderDialog }
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirmation required</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Do you accept to cancel the order?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelOrderDialog} autoFocus>Cancel</Button>
          <Button onClick={handleCancelOrderDialog}>Ok</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
