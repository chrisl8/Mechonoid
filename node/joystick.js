/* eslint-disable no-bitwise */

/*
Original code copied from:
https://raw.githubusercontent.com/JayBeavers/node-joystick/master/joystick.js
 */

import fs from 'fs';
import events from 'events';

/*
 *  id is the file system index of the joystick (e.g. /dev/input/js0 has id '0')
 *
 *  deadZone is the amount of sensitivity at the center of the axis to ignore.
 *    Axis reads from -32k to +32k and empirical testing on an XBox360 controller
 *    shows that a good 'dead stick' value is 3500
 *  Note that this deadZone algorithm assumes that 'center is zero' which is not generally
 *    the case so you may want to set deadZone === 0 and instead perform some form of
 *    calibration.
 *
 *  sensitivity is the amount of change in an axis reading before an event will be emitted.
 *    Empirical testing on an XBox360 controller shows that sensitivity is around 350 to remove
 *    noise in the data
 */

class Joystick extends events {
  constructor({ name, deadZone, sensitivity, devicePath }) {
    super();
    this.name = name;
    this.deadZone = deadZone;
    this.sensitivity = sensitivity;
    this.inputExists = false;
    this.devicePath = devicePath;
  }

  publish() {
    const buffer = Buffer.alloc(8);
    let fd;

    // Last reading from this axis, used for debouncing events using sensitivity setting
    const lastAxisValue = [];
    const lastAxisEmittedValue = [];

    const parse = (thisBuffer) => {
      const event = {
        time: thisBuffer.readUInt32LE(0),
        value: thisBuffer.readInt16LE(4),
        number: thisBuffer[7],
      };

      const type = thisBuffer[6];

      if (type & 0x80) {
        event.init = true;
      }

      if (type & 0x01) {
        event.type = 'button';
      }

      if (type & 0x02) {
        event.type = 'axis';
      }

      event.id = this.id;

      return event;
    };

    const startRead = () => {
      fs.read(fd, buffer, 0, 8, null, onRead);
    };

    const onRead = (err) => {
      if (err) {
        console.log(
          `Error reading ${
            this.name ? this.name : `joystick ${this.uniqueDeviceString}`
          }. Disconnecting and retrying...`,
        );
        this.close();
        return;
      }

      const event = parse(buffer);

      let squelch = false;

      if (event.type === 'axis') {
        if (this.sensitivity) {
          if (
            lastAxisValue[event.number] &&
            Math.abs(lastAxisValue[event.number] - event.value) <
              this.sensitivity
          ) {
            // data squelched due to sensitivity, no self.emit
            squelch = true;
          } else {
            lastAxisValue[event.number] = event.value;
          }
        }

        if (this.deadZone && Math.abs(event.value) < this.deadZone)
          event.value = 0;

        if (lastAxisEmittedValue[event.number] === event.value) {
          squelch = true;
        } else {
          lastAxisEmittedValue[event.number] = event.value;
        }
      }

      if (!squelch) this.emit(event.type, event);
      if (fd) startRead();
    };

    // eslint-disable-next-line consistent-return
    const onOpen = (err, fdOpened) => {
      if (err) return this.emit('error', err);

      this.emit('ready');

      fd = fdOpened;
      startRead();
    };

    this.close = (callback) => {
      fs.close(fd, callback);
      fd = undefined;
      this.emit('close');
    };

    fs.open(this.devicePath, 'r', onOpen);
  }
}

export default Joystick;
