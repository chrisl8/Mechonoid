// Load settings not included in git repo

import fs from 'fs';
import JSON5 from 'json5';

const CONFIG_FOLDER_NAME = 'mechonoid';

const configDataFile = `${process.env.HOME}/.${CONFIG_FOLDER_NAME}/config.json5`;

let configDataImport = {};
try {
  configDataImport = JSON5.parse(fs.readFileSync(configDataFile, 'utf8'));
} catch (e) {
  console.error(`Error loading config file:`);
  console.error(
    `${process.env.HOME}/.${CONFIG_FOLDER_NAME}/config.json5 must exist!`,
  );
  console.error(
    `This should be a link to .${CONFIG_FOLDER_NAME}/config.json5 in your home folder.`,
  );
  console.error(`Please run setup.sh again, or check your file system.`);

  process.exit(1);
}

const configData = configDataImport;

export default configData;
