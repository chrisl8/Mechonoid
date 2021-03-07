const express = require('express');
const socketIo = require('socket.io');
const { debounce } = require('lodash');
const operateServo = require('./operateServo');
const operateServo360 = require('./operateServo360');
const { robotModel, robotModelEmitter } = require('./robotModel');

const app = express();

const config = { webServerPort: 80 };

// All web content is housed in the website folder
app.use(express.static(`${__dirname}/../website/build`));

async function start() {
  /** @namespace config.webServerPort */
  const webServer = app.listen(config.webServerPort);
  const io = socketIo(webServer, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  // Socket listeners
  io.on('connection', (socket) => {
    const address = socket.request.connection.remoteAddress;
    console.log(`Web connection from ${address}`);

    // TODO: Use https://github.com/gullerya/object-observer to watch for changes to robotModel,
    // TODO: Use lodash's debounce to emit robotModel on changes to the socket.
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
      console.log(data);
      const selfMoveToCenterSpeed = 160; // Tweaked to get it to fall on center without going past.
      // Hitting the side requires less precision. Might as well go faster, especially if we might have a long ways to go!
      const selfMoveSpeed = 250;
      console.log(robotModel.servos[data.target]);

      // Make code easier to read by setting easy to read variables.
      const dataIsValid =
        data && data.target && (data.value === 0 || data.value);
      const alreadyAtDestination =
        robotModel.servos[data.target].switchClosed[data.value];
      const destination = data.value;

      if (dataIsValid && !alreadyAtDestination) {
        robotModel.servos[data.target].stopOnArrival = destination;

        if (destination === 'center') {
          if (
            robotModel.servos[data.target].switchClosed.left ||
            (robotModel.servos[data.target].centerOffset === 'left' &&
              !robotModel.servos[data.target].switchClosed.right)
          ) {
            // We are either 'left' of center or AT the left switch, so move right.
            // Note this is also skipped if we THINK we are 'left' of center,
            // but the right switch is actually closed, which happens sometimes.
            console.log(data);
            operateServo360({
              servoName: data.target,
              value: selfMoveToCenterSpeed,
            });
          } else {
            // We already established that the destination is 'center',
            // and that we are not currently AT 'center'
            // SINCE we aren't known to be 'left' of center,
            // and we are not AT the left switch,
            // EITHER we are already right of center,
            // OR we are AT the right edge,
            // OR we have no idea where we are.
            // In which case, moving 'left' is either valid, required,
            // or as good as any other option.
            operateServo360({
              servoName: data.target,
              value: -selfMoveToCenterSpeed,
            });
          }
        } else if (destination === 'right') {
          operateServo360({ servoName: data.target, value: selfMoveSpeed });
        } else if (destination === 'left') {
          operateServo360({ servoName: data.target, value: -selfMoveSpeed });
        } else if (destination === 'front') {
          // TODO: Intelligently move the correct direction based on known position if it is known.
          operateServo360({ servoName: data.target, value: selfMoveSpeed });
        } else if (destination === 'back') {
          // TODO: Intelligently move the correct direction based on known position if it is known.
          operateServo360({ servoName: data.target, value: selfMoveSpeed });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });
}

exports.start = start;
