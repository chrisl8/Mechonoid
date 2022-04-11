import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// https://stackoverflow.com/a/64383997/4982408
const fileName = fileURLToPath(import.meta.url);
const dirName = dirname(fileName);

function runShellScript(script, args, callback) {
  const child = spawn(`${dirName}/../scripts/${script}.sh`, args);
  let resp = '';

  child.stdout.on('data', (buffer) => {
    resp += buffer.toString();
  });
  if (callback) {
    child.stdout.on('end', () => {
      callback(resp);
    });
  }
}

export default runShellScript;
