/* eslint-disable no-restricted-syntax */
import fetch from 'node-fetch';
import { DateTime } from 'luxon';

export async function jobs() {
  const buff = Buffer.from('admin:11a6e82f04e7e7f807037e29a83b5bee1d');
  const base64data = buff.toString('base64');
  const result = await fetch('http://192.168.0.150:8080/view/Invest/api/json', {
    headers: {
      Authorization: `Basic ${base64data}`,
    },
  });
  if (result.status === 200) {
    const json = await result.json();
    return json.jobs;
  } else {
    throw new Error("Failed")
  }
}

export async function job(name: string) {
    const buff = Buffer.from('admin:11a6e82f04e7e7f807037e29a83b5bee1d');
    const base64data = buff.toString('base64');
    const result = await fetch(`http://192.168.0.150:8080/job/${name}/api/json`, {
      headers: {
        Authorization: `Basic ${base64data}`,
      },
    });
    if (result.status === 200) {
      const json = await result.json();
      let url = json.lastSuccessfulBuild.url;
      url = url.replace('broker','192.168.0.150')
      const resultLastSuccessfulBuild = await fetch(url + '/api/json', {
        headers: {
            Authorization: `Basic ${base64data}`,
          },
      });
      const lastSuccessfulBuild =  await resultLastSuccessfulBuild.json();
      const now = DateTime.now();
      const date = DateTime.fromMillis(lastSuccessfulBuild.timestamp);
      const duration = now.diff(date);
      let message: string;
      if (duration.as('days') >= 1) {
        message = Math.round(duration.as('days')) + ' days'
      } else if (duration.as('hours') >= 1) {
        message = Math.round(duration.as('hours')) + ' hours'
      } else if (duration.as('minutes') >= 1) {
        message = Math.round(duration.as('minutes')) + ' minutes'
      } else {
        message = Math.round(duration.as('seconds')) + ' seconds'
      }
      return {
        lastSuccessfulBuild: {
          date,
          message,
        }
      };
    }
    throw new Error("Failed")
  }
  