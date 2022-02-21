// Load settings not included in git repo

import fs from 'fs';

const CONFIG_FOLDER_NAME = 'mechonoid';

// TODO: Convert to JSON5 and add comments and convert to more "JavaScript Object Notation" type format
const configDataFile = `${process.env.HOME}/.${CONFIG_FOLDER_NAME}/config.json`;

let configDataImport = {};
try {
  configDataImport = JSON.parse(fs.readFileSync(configDataFile, 'utf8'));
} catch (e) {
  console.error(
    `Error loading ${process.env.HOME}/.${CONFIG_FOLDER_NAME}/config.json !!!`,
  );
  console.error(
    `${process.env.HOME}/.${CONFIG_FOLDER_NAME}/config.json must exist!`,
  );
  console.error(`Please run setup again, or check your file system.`);

  process.exit(1);
}

const configData = configDataImport;

export default configData;
