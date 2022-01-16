import SerialPort from 'serialport';
import polycrc from 'polycrc';

import wait from './wait.js';

// eslint-disable-next-line new-cap
const crc16xmodem = new polycrc.crc(16, 0x1021, 0x0000, 0x0000, false);
// RoboClaw uses CRC-16/XMODEM
// width=16 poly=0x1021 init=0x0000 refin=false refout=false xorout=0x0000 check=0x31c3 residue=0x0000 name="CRC-16/XMODEM"
// This site gives information on the various CRC types:
// https://reveng.sourceforge.io/crc-catalogue/16.htm#crc.cat.crc-16-xmodem
// This is an excellent site for testing your CRC input/output and ensuring that you are using the right one:
// https://crccalc.com/

// From https://github.com/basicmicro/raspberry_pi_packet_serial/blob/master/roboclaw.py
const commandOptions = {
  M1FORWARD: { command: 0, dataTypes: ['UInt8'] },
  M1BACKWARD: { command: 1, dataTypes: ['UInt8'] },
  SETMINMB: { command: 2 },
  SETMAXMB: { command: 3 },
  M2FORWARD: { command: 4, dataTypes: ['UInt8'] },
  M2BACKWARD: { command: 5, dataTypes: ['UInt8'] },
  M17BIT: { command: 6 },
  M27BIT: { command: 7 },
  MIXEDFORWARD: { command: 8, dataTypes: ['UInt8'] },
  MIXEDBACKWARD: { command: 9, dataTypes: ['UInt8'] },
  MIXEDRIGHT: { command: 10, dataTypes: ['UInt8'] },
  MIXEDLEFT: { command: 11, dataTypes: ['UInt8'] },
  MIXEDFB: { command: 12, dataTypes: ['Int8'] },
  MIXEDLR: { command: 13, dataTypes: ['Int8'] },
  GETM1ENC: { command: 16 },
  GETM2ENC: { command: 17 },
  GETM1SPEED: { command: 18 },
  GETM2SPEED: { command: 19 },
  RESETENC: { command: 20 },
  GETVERSION: { command: 21 },
  SETM1ENCCOUNT: { command: 22, dataTypes: ['UInt16BE'] },
  SETM2ENCCOUNT: { command: 23, dataTypes: ['UInt16BE'] },
  GETMBATT: { command: 24 },
  GETLBATT: { command: 25 },
  SETMINLB: { command: 26 },
  SETMAXLB: { command: 27 },
  SETM1PID: { command: 28 },
  SETM2PID: { command: 29 },
  GETM1ISPEED: { command: 30 },
  GETM2ISPEED: { command: 31 },
  M1DUTY: { command: 32 },
  M2DUTY: { command: 33 },
  MIXEDDUTY: { command: 34 },
  M1SPEED: { command: 35 },
  M2SPEED: { command: 36 },
  MIXEDSPEED: { command: 37, dataTypes: ['Int32BE', 'Int32BE'] },
  M1SPEEDACCEL: { command: 38, dataTypes: ['Int32BE', 'Int32BE'] },
  M2SPEEDACCEL: { command: 39, dataTypes: ['Int32BE', 'Int32BE'] },
  MIXEDSPEEDACCEL: {
    command: 40,
    dataTypes: ['Int32BE', 'Int32BE', 'Int32BE'],
  },
  M1SPEEDDIST: { command: 41 },
  M2SPEEDDIST: { command: 42 },
  MIXEDSPEEDDIST: { command: 43 },
  M1SPEEDACCELDIST: { command: 44 },
  M2SPEEDACCELDIST: { command: 45 },
  MIXEDSPEEDACCELDIST: { command: 46 },
  GETBUFFERS: { command: 47 },
  GETPWMS: { command: 48 },
  GETCURRENTS: { command: 49 },
  MIXEDSPEED2ACCEL: { command: 50 },
  MIXEDSPEED2ACCELDIST: { command: 51 },
  M1DUTYACCEL: { command: 52 },
  M2DUTYACCEL: { command: 53 },
  MIXEDDUTYACCEL: { command: 54 },
  READM1PID: { command: 55 },
  READM2PID: { command: 56 },
  SETMAINVOLTAGES: { command: 57, dataTypes: ['UInt16BE', 'UInt16BE'] },
  SETLOGICVOLTAGES: { command: 58 },
  GETMINMAXMAINVOLTAGES: { command: 59 },
  GETMINMAXLOGICVOLTAGES: { command: 60 },
  SETM1POSPID: { command: 61 },
  SETM2POSPID: { command: 62 },
  READM1POSPID: { command: 63 },
  READM2POSPID: { command: 64 },
  M1SPEEDACCELDECCELPOS: { command: 65 },
  M2SPEEDACCELDECCELPOS: { command: 66 },
  MIXEDSPEEDACCELDECCELPOS: { command: 67 },
  SETM1DEFAULTACCEL: { command: 68 },
  SETM2DEFAULTACCEL: { command: 69 },
  SETPINFUNCTIONS: { command: 74 },
  GETPINFUNCTIONS: { command: 75 },
  SETDEADBAND: { command: 76 },
  GETDEADBAND: { command: 77 },
  RESTOREDEFAULTS: { command: 80 },
  GETTEMP: { command: 82 },
  GETTEMP2: { command: 83 },
  GETERROR: { command: 90 },
  GETENCODERMODE: { command: 91 },
  SETM1ENCODERMODE: { command: 92 },
  SETM2ENCODERMODE: { command: 93 },
  WRITENVM: { command: 94 },
  READNVM: { command: 95 },
  SETCONFIG: { command: 98 },
  GETCONFIG: { command: 99 },
  SETM1MAXCURRENT: {
    command: 133,
    dataTypes: ['Int32BE', 'UInt8', 'UInt8', 'UInt8', 'UInt8'],
  },
  SETM2MAXCURRENT: {
    command: 134,
    dataTypes: ['Int32BE', 'UInt8', 'UInt8', 'UInt8', 'UInt8'],
  },
  GETM1MAXCURRENT: { command: 135 },
  GETM2MAXCURRENT: { command: 136 },
  SETPWMMODE: { command: 148 },
  GETPWMMODE: { command: 149 },
  FLAGBOOTLOADER: { command: 255 },
};

const convertBitstoArray = (bits) => {
  const bitsArray = [];
  // How to read through all the bits in a byte
  // Note that this walks in them in reverse order from what Roboclaw documents them.
  // https://stackoverflow.com/a/18088813/4982408
  for (let i = 7; i >= 0; i--) {
    // eslint-disable-next-line no-bitwise
    const bit = bits[4] & (1 << i) ? 1 : 0;
    // do something with the bit (push to an array if you want a sequence)
    bitsArray.push(bit);
  }
  return bitsArray;
};

class RoboClaw {
  constructor({ comPort, myName = 'RoboClaw' }) {
    this.busy = false;
    this.stack = [];
    this.currentCommand = {};
    this.ready = false;
    // NOTE: When using packet serial commands via the USB connection the address byte can be any
    // value from 0x80 to 0x87 since each USB connection is already unique.
    this.address = 128;
    this.serialPort = new SerialPort(comPort, {
      baudRate: 38400,
      // autoOpen: false,
    });

    this.popAndSendCommandsCount = 0;

    this.serialPort.on('open', () => {
      // See https://downloads.basicmicro.com/docs/roboclaw_user_manual.pdf
      // for information about how to communicate with the RoboClaw
      // Start on Page 58

      console.log('RoboClaw Serial Port Open.');

      this.ready = true; // TODO: Set this to not ready on close.
    });

    this.serialPort.on('data', (data) => {
      const writeOnlyAck = data.length === 1 && data[0] === 0xff;
      let calculatedChecksumDecimalValue;
      let incomingChecksumDecimalValue;

      if (!writeOnlyAck) {
        const dataToChecksumHeader = Buffer.from([
          this.address,
          commandOptions[this.currentCommand.command].command,
        ]);
        const dataToChecksum = Buffer.concat([
          dataToChecksumHeader,
          data.subarray(0, data.length - 2),
        ]);
        incomingChecksumDecimalValue = data.readUInt16BE(
          data.length - 2,
          data.length,
        );
        calculatedChecksumDecimalValue = crc16xmodem(dataToChecksum);
      }

      if (incomingChecksumDecimalValue !== calculatedChecksumDecimalValue) {
        if (this.currentCommand.command) {
          console.error(
            `Checksum mismatch on received data,\npresumably after sending command ${this.currentCommand.command}:`,
          );
        } else {
          console.error(
            `Checksum mismatch on received data with no outgoing command in buffer:`,
          );
        }
        console.error(data.toString('utf8', 0, data.length - 3));
      } else if (this.currentCommand.command === 'GETMBATT') {
        // This will decode the main battery voltage
        /*
        24 - Read Main Battery Voltage Level
        Read the main battery voltage level connected to B+ and B- terminals. The voltage is returned in
        10ths of a volt(eg 300 = 30v).
        Send: [Address, 24]
        Receive: [Value(2 bytes), CRC(2 bytes)]
         */
        if (this.currentCommand.callback) {
          this.currentCommand.callback({
            myName,
            batteryVoltage: data.readInt16BE() / 10,
          });
        }
      } else if (this.currentCommand.command === 'GETTEMP') {
        // This will decode the main battery voltage
        /*
        24 - Read Main Battery Voltage Level
        Read the main battery voltage level connected to B+ and B- terminals. The voltage is returned in
        10ths of a volt(eg 300 = 30v).
        Send: [Address, 24]
        Receive: [Value(2 bytes), CRC(2 bytes)]
         */
        if (this.currentCommand.callback) {
          this.currentCommand.callback({
            myName,
            temperatureOne: data.readInt16BE() / 10,
          });
        }
      } else if (this.currentCommand.command === 'GETTEMP2') {
        // This will decode the main battery voltage
        /*
        24 - Read Main Battery Voltage Level
        Read the main battery voltage level connected to B+ and B- terminals. The voltage is returned in
        10ths of a volt(eg 300 = 30v).
        Send: [Address, 24]
        Receive: [Value(2 bytes), CRC(2 bytes)]
         */
        if (this.currentCommand.callback) {
          this.currentCommand.callback({
            myName,
            temperatureTwo: data.readInt16BE() / 10,
          });
        }
      } else if (this.currentCommand.command === 'GETMINMAXMAINVOLTAGES') {
        /*
        59 - Read Main Battery Voltage Settings
          Read the Main Battery Voltage Settings. The voltage is calculated by dividing the value by 10
          Send: [Address, 59]
          Receive: [Min(2 bytes), Max(2 bytes), CRC(2 bytes)]
         */
        if (this.currentCommand.callback) {
          this.currentCommand.callback({
            myName,
            minimumVoltage: data.readInt16BE() / 10,
            maximumVoltage: data.readInt16BE(2) / 10,
          });
        }
      } else if (this.currentCommand.command === 'GETM1MAXCURRENT') {
        /*
        135 - Read M1 Max Current Limit
        Read Motor 1 Maximum Current Limit. Current value is in 10ma units. To calculate divide value
        by 100. MinCurrent is always 0.
        Send: [Address, 135]
        Receive: [MaxCurrent(4 bytes), MinCurrent(4 bytes), CRC(2 bytes)]
        */
        if (this.currentCommand.callback) {
          this.currentCommand.callback({
            myName,
            maxCurrentOne: data.readInt32BE() / 100,
            // data.readInt32BE(4),
          });
        }
      } else if (this.currentCommand.command === 'GETM2MAXCURRENT') {
        /*
        135 - Read M1 Max Current Limit
        Read Motor 1 Maximum Current Limit. Current value is in 10ma units. To calculate divide value
        by 100. MinCurrent is always 0.
        Send: [Address, 135]
        Receive: [MaxCurrent(4 bytes), MinCurrent(4 bytes), CRC(2 bytes)]
        */
        if (this.currentCommand.callback) {
          this.currentCommand.callback({
            myName,
            maxCurrentTwo: data.readInt32BE() / 100,
            // data.readInt32BE(4),
          });
        }
      } else if (this.currentCommand.command === 'GETENCODERMODE') {
        /*
        91 - Read Encoder Mode
          Read the encoder mode for both motors.
          Send: [Address, 91]
          Receive: [Enc1Mode, Enc2Mode, CRC(2 bytes)]
          Encoder Mode bits
          Bit 7 Enable/Disable RC/Analog Encoder support
          Bit 6 Reverse Encoder Relative Direction
          Bit 5 Reverse Motor Relative Direction
          Bit 4-1 N/A
          Bit 0 Quadrature(0)/Absolute(1)
         */

        const motorOneBitsArray = convertBitstoArray(data[0]);
        const motorTwoBitsArray = convertBitstoArray(data[1]);

        // TODO: Correctly associate this data with the settings,
        // TODO: and save it.
        console.log('RoboClaw Encoder Modes:');
        console.log('  Motor One:');
        console.log(motorOneBitsArray);
        console.log('  Motor Two:');
        console.log(motorTwoBitsArray);
      } else if (this.currentCommand.command === 'GETPINFUNCTIONS') {
        /*
        75 - Get S3, S4 and S5 Modes
          Read mode settings for S3,S4 and S5. See command 74 for mode descriptions
          Send: [Address, 75]
          Receive: [S3mode, S4mode, S5mode, CRC(2 bytes)]
        */
        // TODO: Correctly associate this data with the settings,
        // TODO: and save it.
        console.log('RoboClaw Pin Functions:');
        console.log('  S3', data[0]);
        console.log('  S4', data[1]);
        console.log('  S5', data[2]);
      } else if (this.currentCommand.command === 'GETVERSION') {
        // This will work on the Firmware version.
        // The last two bytes are a CRC code,
        // and the two before that are a termination of a line feed character
        // and a null character.
        // Send: [Address, 21]
        // Receive: [“RoboClaw 10.2A v4.1.11”,10,0, CRC(2 bytes)]
        if (this.currentCommand.callback) {
          this.currentCommand.callback({
            myName,
            version: data.toString('utf8', 0, data.length - 3),
          });
        }
      } else if (this.currentCommand.command === 'GETCURRENTS') {
        /*
        49 - Read Motor Currents
        Read the current draw from each motor in 10ma increments. The amps value is calculated by dividing the value by 100.
        Send: [Address, 49]
        Receive: [M1 Current(2 bytes), M2 Currrent(2 bytes), CRC(2 bytes)]
        */
        if (this.currentCommand.callback) {
          this.currentCommand.callback({
            myName,
            motorOneCurrent: data.readInt16BE() / 100,
            motorTwoCurrent: data.readInt16BE(2) / 100,
          });
        }
      } else if (this.currentCommand.command === 'GETERROR') {
        /*
        90 - Read Status
        Read the current unit status.
        Send: [Address, 90]
        Receive: [Status, CRC(2 bytes)]

        See PDF for status codes.
        */
        const errorDataBits = [];
        for (let i = data.length - 2; i >= 0; i--) {
          // eslint-disable-next-line no-bitwise
          const bit = data[0] & (1 << i) ? 1 : 0;
          // TODO: This may not be in the correct order, and we should interpret them.
          errorDataBits.push(bit);
          let errorDataString = '';
          errorDataBits.forEach((errorBit) => {
            errorDataString += errorBit;
          });
          if (this.currentCommand.callback) {
            this.currentCommand.callback({
              myName,
              errorCodes: errorDataString,
            });
          }
        }
      } else if (this.currentCommand.command === 'GETM1SPEED') {
        console.log(
          data.readUInt8(4) === 0 ? 'Forward: ' : 'Reverse: ',
          data.readInt32BE(),
        );
        // console.log(data.subarray(0, data.length - 2));
      } else if (this.currentCommand.command === 'READM1PID') {
        // This should be the PID values set and saved via the RoboClaw application
        /*
          55 - Read Motor 1 Velocity PID and QPPS Settings
          Read the PID and QPPS Settings.
          Send: [Address, 55]
          Receive: [P(4 bytes), I(4 bytes), D(4 bytes), QPPS(4 byte), CRC(2 bytes)]
          56 - Read Motor 2 Velocity PID and QPPS Settings
          Read the PID and QPPS Settings.
          Send: [Address, 56]
          Receive: [P(4 bytes), I(4 bytes), D(4 bytes), QPPS(4 byte), CRC(2 bytes)]

          Velocity P Proportional setting for PID.
          Velocity I Integral setting for PID.
          Velocity D Differential setting for PID.
          QPPS Maximum speed of motor using encoder counts per second.
            QPPS = "Quad Pulses Per Second", which is also what command 37 uses for speed control in full "differential" drive from "joystick" input,
            so this is what we use for
         */
        if (this.currentCommand.callback) {
          this.currentCommand.callback({
            myName,
            motorOneP: data.readInt32BE(),
            motorOneI: data.readInt32BE(4),
            motorOneD: data.readInt32BE(8),
            motorOneQPPS: data.readInt32BE(12),
          });
        }
      } else if (this.currentCommand.command === 'READM2PID') {
        if (this.currentCommand.callback) {
          this.currentCommand.callback({
            myName,
            motorTwoP: data.readInt32BE(),
            motorTwoI: data.readInt32BE(4),
            motorTwoD: data.readInt32BE(8),
            motorTwoQPPS: data.readInt32BE(12),
          });
        }
      } else if (this.currentCommand.command === 'GETM1ENC') {
        console.log('GETM1ENC');
        /*
        16 - Read Encoder Count/Value M1
              Read M1 encoder count/position.
              Send: [Address, 16]
              Receive: [Enc1(4 bytes), Status, CRC(2 bytes)]
              Quadrature encoders have a range of 0 to 4,294,967,295. Absolute encoder values are converted
              from an analog voltage into a value from 0 to 2047 for the full 2v range.
              The status byte tracks counter underflow, direction and overflow. The byte value represents:
              Bit0 - Counter Underflow (1= Underflow Occurred, Clear After Reading)
              Bit1 - Direction (0 = Forward, 1 = Backwards)
              Bit2 - Counter Overflow (1= Underflow Occurred, Clear After Reading)
              Bit3 - Reserved
              Bit4 - Reserved
              Bit5 - Reserved
              Bit6 - Reserved
              Bit7 - Reserved
         */

        // TODO: Use convertBitsToArray for this.
        // How to read through all the bits in a byte
        // Note that this walks in them in reverse order from what Roboclaw documents them.
        // https://stackoverflow.com/a/18088813/4982408
        let underFlowBit;
        let reverseBit;
        let overFlowBit;
        for (let i = 7; i >= 0; i--) {
          // eslint-disable-next-line no-bitwise
          const bit = data[4] & (1 << i) ? 1 : 0;
          // do something with the bit (push to an array if you want a sequence)
          // console.log(bit);
          if (i === 0) {
            underFlowBit = bit;
          } else if (i === 1) {
            reverseBit = bit;
          } else if (i === 2) {
            overFlowBit = bit;
          }
        }
        console.log(
          'Position: ',
          data.readInt32BE(),
          'Underflow: ',
          underFlowBit,
          'Reverse: ',
          reverseBit,
          'Overflow: ',
          overFlowBit,
        );
        if (this.currentCommand.callback) {
          this.currentCommand.callback({
            motor: 1,
            reverseBit,
            underFlowBit,
            overFlowBit,
            position: data.readInt32BE(),
          });
        }
      } else if (!writeOnlyAck) {
        console.error('Unimplemented command.');
        console.log(this.currentCommand);
        console.log('Data length:', data.length);
        console.log('serial.on(data):');
        console.log(data);
      }
      this.currentCommand = {};
      this.busy = false;
      this.popAndSendCommands();
    });
  }

  send({ command, data = null, callback = null }) {
    if (commandOptions[command] || commandOptions[command] === 0) {
      this.stack.push({ command, data, callback });
      if (!this.busy) {
        // Start a new instance if one isn't in process already.
        this.popAndSendCommands();
      }
    } else {
      console.error('Unknown Roboclaw command: ', command);
    }
  }

  async popAndSendCommands() {
    if (!this.ready) {
      // A bit of a loop to ensure commands that come in before
      // the unit is ready get run.
      await wait(10);
      // The Roboclaw will drop any command that takes more than 10ms
      // to receive, so waiting 10ms guarantees that we never clobber
      // an existing command.
      this.popAndSendCommands();
    } else if (this.stack.length > 0) {
      this.busy = true;
      this.currentCommand = this.stack.shift();

      // Allocate buffer for commands
      let commandBufferLength = 2;
      if (this.currentCommand.data || this.currentCommand.data === 0) {
        let dataTypesFound = false;
        if (
          commandOptions[this.currentCommand.command].dataTypes &&
          commandOptions[this.currentCommand.command].dataTypes.constructor ===
            Array
        ) {
          dataTypesFound = true;
          for (
            let i = 0;
            i < commandOptions[this.currentCommand.command].dataTypes.length;
            i++
          ) {
            if (
              commandOptions[this.currentCommand.command].dataTypes[i] ===
              'UInt8'
            ) {
              commandBufferLength += 1;
            } else if (
              commandOptions[this.currentCommand.command].dataTypes[i] ===
              'UInt16BE'
            ) {
              commandBufferLength += 2;
            } else if (
              commandOptions[this.currentCommand.command].dataTypes[i] ===
              'Int32BE'
            ) {
              commandBufferLength += 4;
            } else {
              dataTypesFound = false;
            }
          }
        }
        if (!dataTypesFound) {
          console.error('Unknown data type for command (buffer allocation):');
          console.error(commandOptions[this.currentCommand.command]);
          // Fail: Clear busy, run again and return.
          this.busy = false;
          this.popAndSendCommands();
          return;
        }
      }
      const commandBuffer = Buffer.alloc(commandBufferLength);

      // Fill command buffer WITH data
      let offset = 1;
      commandBuffer.writeUInt8(this.address);
      commandBuffer.writeUInt8(
        commandOptions[this.currentCommand.command].command,
        offset,
      );
      offset++;
      if (this.currentCommand.data || this.currentCommand.data === 0) {
        let dataTypesFound = false;
        if (
          commandOptions[this.currentCommand.command].dataTypes &&
          commandOptions[this.currentCommand.command].dataTypes.constructor ===
            Array
        ) {
          dataTypesFound = true;
          for (
            let i = 0;
            i < commandOptions[this.currentCommand.command].dataTypes.length;
            i++
          ) {
            let data = this.currentCommand.data;
            if (this.currentCommand.data.constructor === Array) {
              data = this.currentCommand.data[i];
            }
            if (
              commandOptions[this.currentCommand.command].dataTypes[i] ===
              'UInt8'
            ) {
              commandBuffer.writeUInt8(data, offset);
              offset += 1;
            } else if (
              commandOptions[this.currentCommand.command].dataTypes[i] ===
              'UInt16BE'
            ) {
              commandBuffer.writeUInt16BE(data, offset);
              offset += 2;
            } else if (
              commandOptions[this.currentCommand.command].dataTypes[i] ===
              'Int32BE'
            ) {
              commandBuffer.writeInt32BE(data, offset);
              offset += 4;
            } else {
              dataTypesFound = false;
            }
          }
        }
        if (!dataTypesFound) {
          console.error('Unknown data type for command (buffer data fill):');
          console.error(commandOptions[this.currentCommand.command]);
          // Fail: Clear busy, run again and return.
          this.busy = false;
          this.popAndSendCommands();
          return;
        }

        // Calculate and add CRC checksum
        // NOTE: This is ONLY done if there is no data payload
        const checksum = crc16xmodem(commandBuffer);
        const checksumBuffer = Buffer.alloc(2);
        checksumBuffer.writeUInt16BE(checksum);
        const bufferToSend = Buffer.concat([commandBuffer, checksumBuffer]);
        this.serialPort.write(bufferToSend);
      } else {
        this.serialPort.write(commandBuffer);
      }
    }
  }

  // function onData_getRunningBuffer( data )
  // {
  //   var ret = new Buffer( this.carryData.toString() + data );
  //   this.carryData = ret;
  //   return ret;
  // }
}

export default RoboClaw;
