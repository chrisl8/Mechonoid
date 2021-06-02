function roboClawDataHandler(data) {
  // TODO: robotmodel may need setters and getters like Arlobot, to facilitate
  //       taking action when things change.
  if (typeof data === 'object' && data !== null) {
    for (const [key, value] of Object.entries(data)) {
      console.log(`${key}: ${value}`);
    }
  } else {
    console.error('Invalid data from Roboclaw:');
    console.error(data);
  }
}

module.exports = roboClawDataHandler;
