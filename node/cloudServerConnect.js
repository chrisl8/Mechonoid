const os = require('os');
const fetch = require('node-fetch');
const base64 = require('base-64');
const ipAddress = require('./ipAddress');
const { robotModel } = require('./robotModel');

const cloudServerConnect = async () => {
  if (robotModel.cloudServer.exists) {
    const url = `${robotModel.cloudServer.address}addHostname`;
    const ip = ipAddress.ipAddress();
    const hostname = os.hostname();
    const body = { hostname, ip };
    if (robotModel.webServerPort && robotModel.webServerPort !== 80) {
      // No point in adding port 80.
      body.port = robotModel.webServerPort;
    }
    console.log(body);
    try {
      const result = await fetch(url, {
        method: 'post',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${base64.encode(
            `ignored:${robotModel.cloudServer.password}`,
          )}`,
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

module.exports = cloudServerConnect;
