// This will poll the RoboClaw for the current encoder values

import roboClawDataHandler from './roboClawDataHandler.js';
import wait from './wait.js';

const pollingInterval = 1000; // Milliseconds

async function pollRoboClawData(roboClaw) {
  roboClaw.connection.send({
    command: 'GETMBATT',
    callback: roboClawDataHandler,
  });
  roboClaw.connection.send({
    command: 'GETCURRENTS',
    callback: roboClawDataHandler,
  });
  roboClaw.connection.send({
    command: 'GETTEMP',
    callback: roboClawDataHandler,
  });
  roboClaw.connection.send({
    command: 'GETTEMP2',
    callback: roboClawDataHandler,
  });
  roboClaw.connection.send({
    command: 'GETERROR',
    callback: roboClawDataHandler,
  });
}

async function roboClawPolling(roboClaw) {
  while (1) {
    // eslint-disable-next-line no-await-in-loop
    await pollRoboClawData(roboClaw);
    // eslint-disable-next-line no-await-in-loop
    await wait(pollingInterval);
  }
}

export default roboClawPolling;
