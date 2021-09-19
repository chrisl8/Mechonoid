const findUsbDevice = require('./findUsbDevice');
const BenewakeDistanceSensor = require('./BenewakeDistanceSensor');

let previousDistance;

const displayData = (data) => {
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
        // eslint-disable-next-line no-new
        new BenewakeDistanceSensor(benewakeDistanceSensorFtdiPort, displayData);
      }
    } catch (e) {
      console.error('Test failed with error:');
      console.error(e);
    }
  })();
}
