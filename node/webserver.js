const express = require('express');
const socketIo = require('socket.io');
const { debounce } = require('lodash');
const operateServo = require('./operateServo');
const operateServo360 = require('./operateServo360');
const sendServoToLocationUsingSwitches = require('./sendServoToLocationUsingSwitches');
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

  // Socket listeners
  io.on('connection', (socket) => {
    const address = socket.request.connection.remoteAddress;
    console.log(`Web connection from ${address}`);

    const emitRobotModel = debounce(() => {
      socket.emit('robotModel', JSON.stringify(robotModel));
    }, 300);

    emitRobotModel();

    robotModelEmitter.on('update', () => {
      emitRobotModel();
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

    socket.on('sendServoToLocation', (data) => {
      sendServoToLocationUsingSwitches(data);
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });
}

exports.start = start;
