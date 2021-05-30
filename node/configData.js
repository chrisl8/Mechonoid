// Load settings not included in git repo

const fs = require('fs');

const configDataFile = `${process.env.HOME}/.robotAnything/config.json`;

let configData = {};
try {
  configData = JSON.parse(fs.readFileSync(configDataFile, 'utf8'));
} catch (e) {
  console.error(
    `Error loading ${process.env.HOME}/.robotAnything/config.json !!!`,
  );
  console.error(`${process.env.HOME}/.robotAnything/config.json must exist!`);
  console.error(`Please run setup again, or check your file system.`);

  process.exit(1);
}

module.exports = configData;
