import _ from 'lodash';
import { EventEmitter } from 'events';

import { configData } from './configData.js';

// TODO: Front end should indicate the in between positions of rotating parts.

// The hardware functions don't work inside of the Observable system,
// and they don't need to update the web site anyway.
const hardwareFunctions = _.cloneDeep(configData.hardwareControllers);

// The joystick functions are not interesting to the web site,
// and further they can store data that udpates too much for sending
// to the web site continuously.
const joystickConfigurations = _.cloneDeep(configData.joysticks);

const robotModel = _.cloneDeep(configData);
delete robotModel.hardwareControllers;
delete robotModel.joystick;

robotModel.status = 'Online';

robotModel.hardware = {};

const robotModelEmitter = new EventEmitter();

// At this moment, the only consumer of the robotModelEmitter update
// is the web server, and we don't want to overwhelm the network
// with updates.
// If we find this debounce is too long/short, we could
// move it to the webserver end, and change/remove it here.
// At the moment, it seems smart to "emit" fewer events,
// rather than emit them like crazy, and debounce them,
// on the other end.
const debounceCheckAndUpdateFriends = _.debounce(() => {
  robotModelEmitter.emit('update');
}, 300);

// There is no prohibition on updating the robotModel directly,
// but if you want other tools to act on this update,
// such as the front end website being updated,
// then pass the update to this updater instead.
const updateRobotModelData = (path, value) => {
  const currentValue = _.get(robotModel, path);
  if (currentValue !== value) {
    _.set(robotModel, path, value);
    debounceCheckAndUpdateFriends();
  }
};

// You can also just call this to ensure an update happens
const updateRobotModel = () => {
  debounceCheckAndUpdateFriends();
};

export {
  robotModel,
  hardwareFunctions,
  joystickConfigurations,
  robotModelEmitter,
  updateRobotModelData,
  updateRobotModel,
};
