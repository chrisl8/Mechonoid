const findUsbDevice = require('./findUsbDevice');
const BenewakeDistanceSensor = require('./BenewakeDistanceSensor');
const JrkMotorController = require('./JrkMotorController');

const maxTarget = 4090; // True max of 4095 minus 5 to avoid "hanging" close to the end.
const minTarget = 5; // True min of 0 plus 5 to avoid "hanging" close to the end.
const motorController = new JrkMotorController({
  minTarget,
  maxTarget,
});

let previousDistance;
const maxDistance = 100;
let lastState;
let lastTarget;
const outOfRangeTarget = minTarget;
const inRangeTarget = maxTarget;

const handleData = (data) => {
  if (data.distance > maxDistance) {
    if (lastState !== 'outOfRange') {
      console.log('Out of Range');
      lastState = 'outOfRange';
      if (lastTarget !== outOfRangeTarget) {
        lastTarget = outOfRangeTarget;
        motorController.setTarget(outOfRangeTarget);
      }
    }
  } else if (data.distance !== previousDistance) {
    lastState = 'inRange';
    previousDistance = data.distance;
    console.log(data);
    if (lastTarget !== inRangeTarget) {
      lastTarget = inRangeTarget;
      motorController.setTarget(inRangeTarget);
    }
  }
};

const displayData = (data, triggerKey) => {
  if (data) {
    console.log(data);
  }
  if (data.distance !== previousDistance) {
    previousDistance = data.distance;
    console.log(data);
  }
};

if (require.main === module) {
  (async () => {
    try {
      const benewakeDistanceSensorFtdiPort = await findUsbDevice({
        logName: 'Benewake Distance Sensor via FTDI',
        uniqueDeviceString: 'FT232R_USB_UART',
        stringLocation: 'ID_MODEL',
      });

      if (benewakeDistanceSensorFtdiPort) {
        console.log(benewakeDistanceSensorFtdiPort);

        const motorControllerSerialNumber = await motorController.initiate({
          minTarget,
          maxTarget,
        });
        if (motorControllerSerialNumber) {
          console.log(
            `Jrk Motor Controller ${motorControllerSerialNumber} has been found.`,
          );

          motorController.poll(displayData, '');

          // eslint-disable-next-line no-new
          new BenewakeDistanceSensor(
            benewakeDistanceSensorFtdiPort,
            handleData,
          );
        }
      }
    } catch (e) {
      console.error('Test failed with error:');
      console.error(e);
    }
  })();
}
