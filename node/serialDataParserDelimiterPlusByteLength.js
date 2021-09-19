const { Transform } = require('stream');

/**
 * This is a copy of
 * https://github.com/serialport/node-serialport/blob/master/packages/parser-delimiter/lib/index.js
 * combined with
 * https://github.com/serialport/node-serialport/blob/master/packages/parser-byte-length/lib/index.js
 * to create a parser to at expects a delimiter, and then always outputs the next X bytes.
 *
 * I made this to overcome the problem that my device often has identical data in a byte that is next to the delimiter, causing uneven output.
 *
 * A transform stream that emits data each time a byte sequence is received.
 * @extends Transform
 * @summary To use the `Delimiter` parser, provide a delimiter as a string, buffer, or array of bytes. Runs in O(n) time.
 * @example
 const SerialPort = require('serialport')
 const Delimiter = require('@serialport/parser-delimiter')
 const port = new SerialPort('/dev/tty-usbserial1')
 const parser = port.pipe(new Delimiter({ delimiter: '\n' }))
 parser.on('data', console.log)
 */
class DelimiterPlusByteLengthParser extends Transform {
  constructor(options = {}) {
    super(options);

    if (options.delimiter === undefined) {
      throw new TypeError('"delimiter" is not a bufferable object');
    }

    if (options.delimiter.length === 0) {
      throw new TypeError('"delimiter" has a 0 or undefined length');
    }

    if (typeof options.bytesAfterDelimiter !== 'number') {
      throw new TypeError('"bytesAfterDelimiter" is not a number');
    }

    if (options.bytesAfterDelimiter < 1) {
      throw new TypeError('"bytesAfterDelimiter" is not greater than 0');
    }

    this.delimiter = Buffer.from(options.delimiter);

    this.bytesAfterDelimiter = options.bytesAfterDelimiter;
    this.position = 0;
    this.delimiterFound = false;
    this.leftOverBytes = Buffer.alloc(0);

    this.buffer = Buffer.alloc(this.bytesAfterDelimiter);
  }

  _transform(chunk, encoding, cb) {
    if (this.leftOverBytes.length > 0) {
      // eslint-disable-next-line no-param-reassign
      chunk = Buffer.concat([this.leftOverBytes, chunk]);
      this.leftOverBytes = Buffer.alloc(0);
    }
    let cursor = 0;
    while (cursor < chunk.length) {
      if (this.delimiterFound) {
        // We were in the middle of collecting data, so just keep doing it.
        this.buffer[this.position] = chunk[cursor];
        this.position++;
      } else if (chunk.length - cursor < this.delimiter.length) {
        // delimiter is split between this chunk and the next one,
        // so save it off for the next round.
        this.leftOverBytes = chunk.slice(cursor);
        // Ensure that loop ends now, regardless of how long the delimiter was,
        // by moving cursor to end of the chunk
        cursor = chunk.length;
      } else if (
        chunk
          .slice(cursor, cursor + this.delimiter.length)
          .equals(this.delimiter)
      ) {
        this.delimiterFound = true;
        // Move cursor forward entire length of delimiter,
        // but subtract 1 so that the cursor++ can still be placed at the end
        cursor += this.delimiter.length - 1;
      }
      if (this.position === this.bytesAfterDelimiter) {
        this.push(this.buffer);
        this.buffer = Buffer.alloc(this.bytesAfterDelimiter);
        this.position = 0;
        this.delimiterFound = false;
      }
      cursor++;
    }
    cb();
  }

  _flush(cb) {
    this.push(this.buffer);
    this.buffer = Buffer.alloc(this.bytesAfterDelimiter);
    cb();
  }
}

module.exports = DelimiterPlusByteLengthParser;
