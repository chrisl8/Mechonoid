// This will poll the RoboClaw for the current encoder values

import roboClawDataHandler from './roboClawDataHandler.js';
import wait from './wait.js';

const pollingInterval = 5000; // Milliseconds
const minimumTimeSinceLastCommandSent = 500; // Milliseconds

async function pollRoboClawData(roboClaw) {
  roboClaw.connection.send({
    command: 'GETMBATT',
    callback: roboClawDataHandler,
  });
  await wait(pollingInterval);
  roboClaw.connection.send({
    command: 'GETTEMP',
    callback: roboClawDataHandler,
  });
  await wait(pollingInterval);
  roboClaw.connection.send({
    command: 'GETTEMP2',
    callback: roboClawDataHandler,
  });
  await wait(pollingInterval);
  // TODO:
  // 'GETCURRENTS'
  // 'GETERROR'
}

async function roboClawPolling(roboClaw) {
  while (1) {
    // eslint-disable-next-line no-await-in-loop
    await wait(pollingInterval);
    // eslint-disable-next-line no-await-in-loop
    await pollRoboClawData(roboClaw);
  }
}

export default roboClawPolling;
