import { updateRobotModelData } from './robotModel.js';

function roboClawDataHandler(data) {
  // TODO: robotmodel may need setters and getters like Arlobot, to facilitate
  //       taking action when things change.
  if (typeof data === 'object' && data !== null) {
    // TODO: Parse and use specific data types, and log anything to console that isnt' found.
    if (data.hasOwnProperty('myName')) {
      for (const [key, value] of Object.entries(data)) {
        if (key !== 'myName') {
          updateRobotModelData(`hardware.${data.myName}.${key}`, value);
        }
      }
      return;
    }
    for (const [key, value] of Object.entries(data)) {
      console.log(`${key}: ${value}`);
    }
  } else {
    console.error('Invalid data from Roboclaw:');
    console.error(data);
  }
}

export default roboClawDataHandler;
