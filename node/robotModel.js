const { EventEmitter } = require('events');
const Observable = require('object-observer');

const configData = require('./configData');

// TODO: Front end should indicate the in between positions.

// The hardware functions don't work inside of the Observable system,
// and they don't need to update the web site anyway.
const hardwareFunctions = {
  roboClawDevice: null,
  roboClaw: null,
  roboClawReady: null,
  maestroReady: false,
  maestroBoard: null,
  maestro: null,
};

const robotModel = configData;

// TODO: These ready variables should not be duplicated. Whoever reads them should use the robotModel
robotModel.hardware = {
  maestroReady: hardwareFunctions.maestroReady,
  roboClawReady: hardwareFunctions.roboClawReady,
};

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
