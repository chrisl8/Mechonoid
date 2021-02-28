const { EventEmitter } = require('events');
const Observable = require('object-observer');

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

const robotModel = {
  status: 'Online',
  mainBatteryVoltage: null,
  servos: {
    // Remember to multiply us by 4!
    eyeStalk: {
      channel: 0,
      type: 180,
      minimum: 500 * 4,
      maximum: 2500 * 4,
      center: 1450 * 4,
      off: 0,
      lastValue: 0,
    },
    head: {
      channel: 1,
      type: 360,
      minimum: 800 * 4,
      maximum: 2000 * 4,
      center: 1450 * 4,
      off: 0,
      switchClosed: {
        front: false,
        left: false,
        back: false,
        right: false,
      },
      lastValue: 0,
      locationQuadrant: null, // TODO: Sort out some way to track location between pins.
      stopOnArrival: null,
    },
    shoulders: {
      channel: 2,
      type: 360,
      minimum: 800 * 4,
      maximum: 2000 * 4,
      center: 1450 * 4,
      off: 0,
      switchClosed: {
        left: false,
        center: false,
        right: false,
      },
      lastValue: 0,
      centerOffset: null,
      stopOnArrival: null,
    },
  },
  gpioPins: [
    {
      pin: 26,
      location: 'shoulders',
      entry: 'left',
      operations: ['stopIfLessThanZero', 'rectifyCenterOffset'],
    },
    {
      pin: 19,
      location: 'shoulders',
      entry: 'center',
      operations: ['setCenterOffset'],
    },
    {
      pin: 13,
      location: 'shoulders',
      entry: 'right',
      operations: ['stopIfGreaterThanZero', 'rectifyCenterOffset'],
    },
    {
      pin: 12,
      location: 'head',
      entry: 'front',
      operations: [],
    },
    {
      pin: 16,
      location: 'head',
      entry: 'right',
      operations: [],
    },
    {
      pin: 20,
      location: 'head',
      entry: 'back',
      operations: [],
    },
    {
      pin: 21,
      location: 'head',
      entry: 'left',
      operations: [],
    },
  ],
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
