import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function JobsSuccessDate(props: { name: string }) {
  const [toggle, setToggle] = useState(true);
  const [text, setText] = useState('');
  const [job, setJob] : [any, any] = useState([]);
  const navigate = useNavigate();

  useEffect( () => {
    async function action() {
      const response = await fetch(`/api/jenkins/jobs/${props.name}`);
      const json = await response.json();
      if (json.success) {
        setJob(json.job);
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
    { job?.lastSuccessfulBuild?.message }
 </div>);
}