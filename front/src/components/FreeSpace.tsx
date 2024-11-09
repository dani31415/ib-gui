import { useState, useEffect } from 'react';

function FreeSpace() {
  const [freespace, setFreespace] : [any, any] = useState({});

  useEffect( () => {
    async function action() {
      const response = await fetch("/api/freespace");
      const json = await response.json();
      setFreespace(json.freespace);
    }
    action().catch(console.error);
  }, []);

  return (
    <div className="FreeSpace">{ Object.keys(freespace).map( (x:string) => 
        <div>
            {x}:<span>&nbsp;</span>
            { freespace[x].map( (s:any) => <span style={s>95?{color:'red'}:{}}> {s}% </span> ) }
        </div>
    )}</div>
  );
}

export default FreeSpace;
