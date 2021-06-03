const express = require('express');
const socketIo = require('socket.io');
const { debounce } = require('lodash');
const operateServo = require('./operateServo');
const operateServo360 = require('./operateServo360');
const operateMotorSpeed = require('./operateMotorSpeed');
const sendServoToLocationUsingSwitches = require('./sendServoToLocationUsingSwitches');
const shutDown = require('./shutDown');
const { robotModel, robotModelEmitter } = require('./robotModel');

const app = express();

// All web content is housed in the website folder
app.use(express.static(`${__dirname}/../website/build`));

// TODO: Track if a move command HAS come in from a client, has not been zeroed, and they disconnect, so we can stop it.

// TODO: Deal with the case of a GET to move in a direction (as opposed to to a location) that is never stopped (timeout?)

async function start() {
  /** @namespace robotModel.webServerPort */
  const webServer = app.listen(robotModel.webServerPort);
  const io = socketIo(webServer, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  // HTTP GET Listeners
  app.get('/model', (req, res) => {
    res.json(robotModel);
  });

  app.get('/sendServoToLocation/:target/:value', (req, res) => {
    sendServoToLocationUsingSwitches({
      target: req.params.target,
      value: req.params.value,
    });
    res.sendStatus(200);
  });

  // servo360
  app.get('/servo360/:target/:value', (req, res) => {
    operateServo360({ servoName: req.params.target, value: req.params.value });
    res.sendStatus(200);
  });

  // servo
  app.get('/servo/:target/:value', (req, res) => {
    operateServo({
      servoName: req.params.target,
      value: req.params.value,
    });
    res.sendStatus(200);
  });

  // motorSpeed
  app.get('/motorSpeed/:target/:value', (req, res) => {
    operateMotorSpeed({
      motorName: req.params.target,
      value: req.params.value,
    });
    res.sendStatus(200);
  });

  // Socket listeners
  io.on('connection', (socket) => {
    const address = socket.request.connection.remoteAddress;
    console.log(`Web connection from ${address}`);

    // NOTE: This is debounced at 300ms on the sending end.
    // If that debounce is removed, then be sure to debounce
    // it here!
    const emitRobotModelToFrontEnd = () => {
      socket.emit('robotModel', JSON.stringify(robotModel));
    };

    emitRobotModelToFrontEnd();

    robotModelEmitter.on('update', () => {
      emitRobotModelToFrontEnd();
    });

    socket.on('servo360', (data) => {
      if (data && data.target && (data.value === 0 || data.value)) {
        operateServo360({ servoName: data.target, value: data.value });
      }
    });

    socket.on('servo', (data) => {
      if (data && data.target && (data.value === 0 || data.value)) {
        operateServo({ servoName: data.target, value: data.value });
      }
    });

    socket.on('motorSpeed', (data) => {
      if (data && data.target && (data.value === 0 || data.value)) {
        operateMotorSpeed({ motorName: data.target, value: data.value });
      }
    });

    socket.on('sendServoToLocation', (data) => {
      sendServoToLocationUsingSwitches(data);
    });

    // TODO: Send signal to web site that robot is offline before shutting down.
    // TODO: Maybe combine shutdown and reboot with a flag for reboot.
    socket.on('reboot', () => {
      shutDown({ reboot: true });
    });

    // TODO: Send signal to web site that robot is offline before shutting down.
    socket.on('shutdown', () => {
      shutDown();
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });
}

exports.start = start;
