import SerialPort from 'serialport';
import DelimiterPlusByteLengthParser from './serialDataParserDelimiterPlusByteLength.js';

/* Benewake TF02-Pro Serial Communication for Node.js

    The manual for the Benewake TF02-Pro is available at the Benewake web site.
    Note to use the “English” site: http://en.benewake.com/support
      → Pick TF02-Pro
      → Select "TF02-Pro_Product Mannual"

 */

class BenewakeDistanceSensor {
  constructor(comPort, callback = null) {
    this.ready = false;
    this.callback = callback;
    this.serialPort = new SerialPort(comPort, {
      baudRate: 115200,
      // autoOpen: false,
    });
    this.parser = this.serialPort.pipe(
      /* Data Structure
      "each data frame contains 9 bytes, including the distance value, signal strength, temperature of chip and data check byte (Checksum), etc."

      Byte0 	0x59, frame header, same for each frame
      Byte1 	0x59, frame header, same for each frame
       */
      new DelimiterPlusByteLengthParser({
        delimiter: Buffer.from('5959', 'hex'),
        bytesAfterDelimiter: 7,
      }),
    );

    this.serialPort.on('open', () => {
      console.log('Benewake Serial Port Open.');

      this.ready = true; // TODO: Set this to not ready on close.
    });

    this.parser.on('data', (data) => {
      /* Data Structure
      "each data frame contains 9 bytes, including the distance value, signal strength, temperature of chip and data check byte (Checksum), etc."

      The two header bytes are stripped by the parser above, so we just end up with the 7 meaningful bytes here.
       */
      if (data.length === 7) {
        /* Distance
          Units: Centimeters
          Range: 0 to 4500
            "When the signal strength is lower than 60, the detection is unreliable, TF02-Pro will set distance value to 4500. When the signal strength is larger than 60 and the actual distance is between 45 and 60 meters, the output value is 4500. When the signal strength is larger than 60 and the actual distance is more than 60 meters, there will be periodic data, in which case the data is 0 or other abnormal values."
  */
        const distance = data.readUInt16LE(0, 1);

        /* Signal Strength
        Range: 0 to 65535
        "Represents the signal strength with the default value in the range of 0-65535. After the distance mode is set, the longer the measurement distance is, the lower the signal strength will be; The lower the reflectivity is, the lower the signal strength will be."
         */
        const strength = data.readUInt16LE(2, 3);

        /* Temperature
          "Represents the chip temperature of TF02-Pro. Degree centigrade = Temp / 8 -256"
         */
        const temp = Math.trunc(data.readUInt16LE(4, 5) / 8 - 256);

        /* Checksum
        "Checksum is the lower 8 bits of the cumulative sum of the number of the first 8 bytes"
         */
        const checksum = data.readUInt8(6);
        // Calculate checksum
        const buf = Buffer.alloc(2);
        buf.writeUInt16LE(
          89 + // 59 Hex, for the first bit of the header stripped off by the parser
            89 + // 59 Hex, for the second bit of the header stripped off by the parser
            data.readUInt8(0) +
            data.readUInt8(1) +
            data.readUInt8(2) +
            data.readUInt8(3) +
            data.readUInt8(4) +
            data.readUInt8(5),
        );
        const checksumCalculation = buf.readUInt8(0);
        if (checksum !== checksumCalculation) {
          console.error(
            'ERROR: Benewake serial output with bad checksum received!',
          );
        } else if (this.callback) {
          this.callback({ distance, strength, temp });
        } else {
          // Console log the data if there is nothing else to do with it.
          console.log(distance, strength, temp);
        }
      } else {
        console.error(
          'ERROR: Benewake serial output of incorrect length received!',
        );
      }
    });
  }
}

export default BenewakeDistanceSensor;
