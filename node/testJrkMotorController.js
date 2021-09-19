const JrkMotorController = require('./JrkMotorController');
const { robotModel } = require('./robotModel');

const maxTarget = 4090; // True max of 4095 minus 5 to avoid "hanging" close to the end.
const minTarget = 5; // True min of 0 plus 5 to avoid "hanging" close to the end.

const testController = new JrkMotorController({
  minTarget,
  maxTarget,
});

let previousDistance;

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
      const testControllerSerialNumber = await testController.initiate();
      if (testControllerSerialNumber) {
        console.log(
          `Jrk Motor Controller ${testControllerSerialNumber} has been found.`,
        );
        const one = testController.poll(displayData, '');
        const two = testController.poll(displayData, '');
        console.log(`First poll ran: ${one}`);
        console.log(`Second poll ran: ${two}`);
        testController.setTarget(5);
      }
    } catch (e) {
      console.error('Test failed with error:');
      console.error(e);
    }
  })();
}
