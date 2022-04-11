// Load settings not included in git repo

import fs from 'fs';
import JSON5 from 'json5';
import prettier from 'prettier';

const CONFIG_FOLDER_NAME = 'mechonoid';

const configDataFile = `${process.env.HOME}/.${CONFIG_FOLDER_NAME}/config.json5`;

const saveConfigFile = (text) => {
  const formatted = prettier.format(text, {
    parser: 'json5',
    singleQuote: true,
    trailingComma: 'es5',
    printWidth: 80,
  });
  fs.writeFileSync(configDataFile, formatted, 'utf8');
};

const readConfigFile = () => fs.readFileSync(configDataFile, 'utf8');

let configDataTemp = {};
// TODO: Catch missing REQUIRED entries (if there are any?)
try {
  configDataTemp = JSON5.parse(readConfigFile());
} catch (e) {
  console.error(`Error loading config file:`);
  console.error(e.message);
  configDataTemp = {
    error: `There was an error loading your config file!`,
    errorMessage: e.message,
    errorPath: `${process.env.HOME}/.${CONFIG_FOLDER_NAME}/config.json5`,
  };
}

const configData = configDataTemp;

export { configData, readConfigFile, saveConfigFile };
