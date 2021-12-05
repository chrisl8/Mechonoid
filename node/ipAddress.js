import os from 'os';
import esMain from 'es-main';

const interfaces = os.networkInterfaces();

const ipAddress = () => {
  let ip = false;
  let firstInterface;
  for (const networkInterface in interfaces) {
    if (
      interfaces.hasOwnProperty(networkInterface) &&
      networkInterface !== 'lo' &&
      firstInterface === undefined
    ) {
      firstInterface = networkInterface;
    }
  }
  if (firstInterface) {
    ip = interfaces[firstInterface][0].address;
  }
  return ip;
};

export default ipAddress;

if (esMain(import.meta)) {
  // Run the function if this is called directly instead of required.
  /* istanbul ignore next */
  console.log(ipAddress());
}
