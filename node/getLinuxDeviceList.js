import fs from 'fs';

async function getLinuxDeviceList(rootFolder, interestingDeviceNames) {
  return new Promise((resolve, reject) => {
    // all /dev/ttyUSB* and /dev/ttyACM* file names
    fs.readdir(rootFolder, (err, list) => {
      if (err) {
        reject(err);
      } else {
        const outputList = [];
        for (let i = 0; i < list.length; i++) {
          for (let j = 0; j < interestingDeviceNames.length; j++) {
            if (list[i].includes(interestingDeviceNames[j])) {
              outputList.push(list[i]);
            }
          }
        }
        resolve(outputList);
      }
    });
  });
}

export default getLinuxDeviceList;
