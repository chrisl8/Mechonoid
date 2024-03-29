import os from 'os';
import fetch from 'node-fetch';
import ipAddress from './ipAddress.js';
import { robotModel } from './robotModel.js';

const cloudServerConnect = async () => {
  if (robotModel.cloudServer.exists) {
    const url = `${robotModel.cloudServer.address}addHostname`;
    const ip = ipAddress();
    const hostname = os.hostname();
    const body = { hostname, ip };
    if (robotModel.webServerPort && robotModel.webServerPort !== 80) {
      // No point in adding port 80.
      body.port = robotModel.webServerPort;
    }
    try {
      const result = await fetch(url, {
        method: 'post',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `ignored:${robotModel.cloudServer.password}`,
          ).toString('base64')}`,
        },
      });

      if (result.ok) {
        console.log('Cloud Server updated, connect to local site via:');
        console.log(`${robotModel.cloudServer.address}redirect/${hostname}`);
      } else {
        console.error('Error connecting to Cloud Server:');
        console.error(result);
      }
    } catch (e) {
      console.error('Error connecting to Cloud Server:');
      console.error(e);
    }
  }
};

export default cloudServerConnect;
