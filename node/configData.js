// Load settings not included in git repo

import fs from 'fs';

const configDataFile = `${process.env.HOME}/.robotAnything/config.json`;

let configDataImport = {};
try {
  configDataImport = JSON.parse(fs.readFileSync(configDataFile, 'utf8'));
} catch (e) {
  console.error(
    `Error loading ${process.env.HOME}/.robotAnything/config.json !!!`,
  );
  console.error(`${process.env.HOME}/.robotAnything/config.json must exist!`);
  console.error(`Please run setup again, or check your file system.`);

  process.exit(1);
}

const configData = configDataImport;

export default configData;
