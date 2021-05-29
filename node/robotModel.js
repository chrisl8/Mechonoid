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
  robotName: 'Dalek One',
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
    leftArmVertical: {
      channel: 3,
      type: 180,
      minimum: 500 * 4,
      maximum: 2500 * 4,
      center: 1450 * 4,
      off: 0,
      lastValue: 0,
      vertical: true,
    },
    leftArmHorizontal: {
      channel: 4,
      type: 180,
      minimum: 500 * 4,
      maximum: 2500 * 4,
      center: 1450 * 4,
      off: 0,
      lastValue: 0,
    },
    rightArmVertical: {
      channel: 5,
      type: 180,
      minimum: 500 * 4,
      maximum: 2500 * 4,
      center: 1450 * 4,
      off: 0,
      lastValue: 0,
    },
    rightArmHorizontal: {
      channel: 6,
      type: 180,
      minimum: 500 * 4,
      maximum: 2500 * 4,
      center: 1450 * 4,
      off: 0,
      lastValue: 0,
    },
    head: {
      trulyContinuous: true,
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
      locationPoints: null, // Front: 0, 1, Left: 2, 3, Back: 4, 5, Right: 6, 7
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
      operations: ['setPositionInteger'],
    },
    {
      pin: 16,
      location: 'head',
      entry: 'right',
      operations: ['setPositionInteger'],
    },
    {
      pin: 20,
      location: 'head',
      entry: 'back',
      operations: ['setPositionInteger'],
    },
    {
      pin: 21,
      location: 'head',
      entry: 'left',
      operations: ['setPositionInteger'],
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
