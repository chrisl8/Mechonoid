const { EventEmitter } = require('events');
const Observable = require('object-observer');

const configData = require('./configData');

// This is for things that don't belong in webModel,
// or things that need to be "picked up" from weModel,
// and acted on before being tagged on the robot

// TODO: When this data is updated, tell the front end,
//       Front end should light up current position,
//       and indicate in between positions.

// TODO: Arlo has a webModel and robotModel. Split this up if needed.

// The hardware functions don't work inside of the Observable system,
// and they don't need to update the web site anyway.
const hardwareFunctions = {
  roboClawDevice: null,
  roboClaw: null,
  maestroReady: false,
  maestroBoard: null,
  maestro: null,
};

const robotModel = configData;

const observableRobotModel = Observable.from(robotModel);

const robotModelEmitter = new EventEmitter();

observableRobotModel.observe(() => {
  robotModelEmitter.emit('update');
});

module.exports = {
  robotModel: observableRobotModel,
  hardwareFunctions,
  robotModelEmitter,
};
