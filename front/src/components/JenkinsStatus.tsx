import { useState, useEffect } from 'react';

function JenkinsStatus() {
  const [text, setText] = useState('?');

  useEffect( () => {
    async function action() {
      const response = await fetch("/api/jenkins/status");
      const json = await response.json();
      setText(json.success ? 'Ok': 'Failed');
    }
    action().catch(console.error);
  }, []);

  return (
    <div className="JenkinsStatus">{ text }</div>
  );
}

export default JenkinsStatus;
