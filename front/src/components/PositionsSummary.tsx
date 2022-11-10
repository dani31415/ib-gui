import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PositionsSummary() {
  const [text, setText] = useState('?');
  const [toggle, setToggle] = useState(true);
  const navigate = useNavigate();

  useEffect( () => {
    setText('?');
    async function action() {
      const response = await fetch("/api/positions/summary");
      const json = await response.json();
      if (json.success) {
        const gains = Math.round(json.gains * 1000) / 1000;
        setText(`${gains}`);
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

  return (
    <div className="PositionsSummary">{ text }</div>
  );
}

export default PositionsSummary;
  