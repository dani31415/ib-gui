/* eslint-disable no-restricted-syntax */
import fetch from 'node-fetch';

export default async function jenkinsStatus() {
  const buff = Buffer.from('admin:11a6e82f04e7e7f807037e29a83b5bee1d');
  const base64data = buff.toString('base64');
  const result = await fetch('http://192.168.0.150:8080/view/Invest/api/json', {
    headers: {
      Authorization: `Basic ${base64data}`,
    },
  });
  let success;
  let message = null;
  let isRunningJob = false;
  let numberOfJobs = 0;
  let runningJob;
  if (result.status === 200) {
    success = true;
    message = 'Success.';
    const json = await result.json();
    numberOfJobs = json.jobs.length;
    for (const job of json.jobs) {
      if (job.color !== 'blue' && job.color !== 'blue_anime' && job.color !== 'aborted' && job.color !== 'disabled') {
        success = false;
        message = 'A job failed';
      }
      if (job.color === 'blue_anime') {
        message = 'Runing a job';
        isRunningJob = true;
        runningJob = job.name;
      }
    }
  } else {
    success = false;
    message = 'Failed jenkins connection';
  }
  return {
    success,
    message,
    numberOfJobs,
    isRunningJob,
    runningJob,
  };
}
