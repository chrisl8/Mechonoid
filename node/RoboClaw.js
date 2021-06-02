const SerialPort = require('serialport');
const polycrc = require('polycrc');

const wait = require('./wait');
const robotModel = require('./robotModel');

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
  M1FORWARD: { command: 0, dataType: 'UInt8' },
  M1BACKWARD: { command: 1, dataType: 'UInt8' },
  SETMINMB: { command: 2 },
  SETMAXMB: { command: 3 },
  M2FORWARD: { command: 4, dataType: 'UInt8' },
  M2BACKWARD: { command: 5, dataType: 'UInt8' },
  M17BIT: { command: 6 },
  M27BIT: { command: 7 },
  MIXEDFORWARD: { command: 8, dataType: 'UInt8' },
  MIXEDBACKWARD: { command: 9, dataType: 'UInt8' },
  MIXEDRIGHT: { command: 10, dataType: 'UInt8' },
  MIXEDLEFT: { command: 11 },
  MIXEDFB: { command: 12 },
  MIXEDLR: { command: 13 },
  GETM1ENC: { command: 16 },
  GETM2ENC: { command: 17 },
  GETM1SPEED: { command: 18 },
  GETM2SPEED: { command: 19 },
  RESETENC: { command: 20 },
  GETVERSION: { command: 21 },
  SETM1ENCCOUNT: { command: 22, dataType: 'UInt16BE' },
  SETM2ENCCOUNT: { command: 23, dataType: 'UInt16BE' },
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
  MIXEDSPEED: { command: 37 },
  M1SPEEDACCEL: { command: 38 },
  M2SPEEDACCEL: { command: 39 },
  MIXEDSPEEDACCEL: { command: 40 },
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
  SETMAINVOLTAGES: { command: 57 },
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
  SETM1MAXCURRENT: { command: 133 },
  SETM2MAXCURRENT: { command: 134 },
  GETM1MAXCURRENT: { command: 135 },
  GETM2MAXCURRENT: { command: 136 },
  SETPWMMODE: { command: 148 },
  GETPWMMODE: { command: 149 },
  FLAGBOOTLOADER: { command: 255 },
};

class RoboClaw {
  constructor(comPort) {
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
        robotModel.mainBatteryVoltage = data.readInt16BE() / 10;
        console.log(robotModel.mainBatteryVoltage);
      } else if (this.currentCommand.command === 'GETVERSION') {
        // This will work on the Firmware version.
        // The last two bytes are a CRC code,
        // and the two before that are a termination of a line feed character
        // and a null character.
        // Send: [Address, 21]
        // Receive: [“RoboClaw 10.2A v4.1.11”,10,0, CRC(2 bytes)]
        console.log(data.toString('utf8', 0, data.length - 3)); // Version Text
      } else if (this.currentCommand.command === 'GETM1SPEED') {
        console.log(
          data.readUInt8(4) === 0 ? 'Forward: ' : 'Reverse: ',
          data.readInt32BE(),
        );
        // console.log(data.subarray(0, data.length - 2));
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
        // How to read through all of the bits in a byte
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
      let commandBufferLength = 2;
      if (this.currentCommand.data || this.currentCommand.data === 0) {
        if (commandOptions[this.currentCommand.command].dataType === 'UInt8') {
          commandBufferLength = 3;
        } else if (
          commandOptions[this.currentCommand.command].dataType === 'UInt16BE'
        ) {
          commandBufferLength = 6;
        } else {
          console.error('Unknown data type for command:');
          console.error(commandOptions[this.currentCommand.command]);
          // Fail: Clear busy, run again and return.
          this.busy = false;
          this.popAndSendCommands();
          return;
        }
      }
      const commandBuffer = Buffer.alloc(commandBufferLength);
      commandBuffer.writeUInt8(this.address);
      commandBuffer.writeUInt8(
        commandOptions[this.currentCommand.command].command,
        1,
      );
      if (this.currentCommand.data || this.currentCommand.data === 0) {
        // Commands that include data also need to include a checksum.
        if (commandOptions[this.currentCommand.command].dataType === 'UInt8') {
          commandBuffer.writeUInt8(this.currentCommand.data, 2);
        } else if (
          commandOptions[this.currentCommand.command].dataType === 'UInt16BE'
        ) {
          commandBuffer.writeUInt16BE(this.currentCommand.data, 2);
        } else {
          console.error('Unknown data type for command:');
          console.error(commandOptions[this.currentCommand.command]);
          // Fail: Clear busy, run again and return.
          this.busy = false;
          this.popAndSendCommands();
          return;
        }
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

module.exports = RoboClaw;
