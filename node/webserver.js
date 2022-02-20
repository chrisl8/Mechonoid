import express from 'express';
import { Server } from 'socket.io';
// https://stackoverflow.com/a/64383997/4982408
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import operateServo from './operateServo.js';
import operateServo360 from './operateServo360.js';
import operateMotor from './operateMotor.js';
import sendServoToLocationUsingSwitches from './sendServoToLocationUsingSwitches.js';
import shutDown from './shutDown.js';
import { robotModel, robotModelEmitter } from './robotModel.js';

// https://stackoverflow.com/a/64383997/4982408
const fileName = fileURLToPath(import.meta.url);
const dirName = dirname(fileName);

const app = express();

// All web content is housed in the website folder
app.use(express.static(`${dirName}/../website/build`));

// TODO: Track if a move command HAS come in from a client, has not been zeroed, and they disconnect, so we can stop it.

// TODO: Deal with the case of a GET to move in a direction (as opposed to to a location) that is never stopped (timeout?)

function strippedRobotModel(inputRobotModel) {
  const copy = { ...inputRobotModel };
  // Use this to strip out anything the front end shouldn't see.
  delete copy.cloudServer;
  return copy;
}

async function webserver() {
  /** @namespace robotModel.webServerPort */
  const webServer = app.listen(
    robotModel.webServerPort ? robotModel.webServerPort : 80,
  );
  const io = new Server(webServer, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  // HTTP GET Listeners
  app.get('/model', (req, res) => {
    res.json(strippedRobotModel(robotModel));
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

  // motor
  app.get('/motor/:target/:value', (req, res) => {
    operateMotor({
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
      socket.emit('robotModel', JSON.stringify(strippedRobotModel(robotModel)));
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

    socket.on('motor', (data) => {
      if (data && data.target && (data.value === 0 || data.value)) {
        operateMotor({
          motorName: data.target,
          value: data.value,
        });
      } else if (data && data.twist && typeof data.twist === 'object') {
        operateMotor({
          motorName: data.target,
          twist: data.twist,
        });
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
      shutDown({ reboot: false });
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });
}

export default webserver;
