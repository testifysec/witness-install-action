const core = require('@actions/core');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');
const fs = require('fs');



async function setup() {
  witnessURL = `https://github.com/testifysec/witness/releases/download/test-archivist-003/witness`

  // Get version of tool to be installed
  const version = core.getInput('version');


  // Download the specific version of the tool, e.g. as a tarball
  //const pathToTarball = await tc.downloadTool(getDownloadURL());

  // Extract the tarball onto the runner
  const pathToCLI = await tc.downloadTool(witnessURL, "./witness");
  exec.exec('chmod', ['+x', pathToCLI]);
  core.info(`Extracted witness to ${pathToCLI}`);
  await addShell();

  // Expose the tool by adding it to the PATH
  core.addPath(pathToCLI);
}




async function addShell() {


  const shellCommandb64 = "IyEvYmluL3NoCgpleHBvcnQgV0lUTkVTU19TVEVQX05BTUU9InRlc3QiCgpzaGVsbCgpIHsKICAgIFRPUENNRD0kQCBiYXNoIC1jICd3aGlsZSByZWFkIC1wICIke1RPUENNRCMjKi99PiAiIC1yYSBzdWI7IGRvCiAgICAgICAgY2FzZSAke3N1YlswXTotfSBpbgogICAgICAgICIiKSBjb250aW51ZTs7CiAgICAgICAgZXhpdCkgZXhpdDs7CiAgICAgICAgZXNjYXBlKSAoc2V0IC14OyAke3N1YltAXToxfSk7OwogICAgICAgICopIChzZXQgLXg7IHNjcmliZSAtLXN0ZXAtbmFtZT0ke1NURVBfTkFNRX0gLS0gJHtUT1BDTUR9ICR7c3ViW0BdfSk7OwogICAgICAgIGVzYWMKICAgICAgICBkb25lJwp9CgpzaGVsbCAiJEAi";
  const shellCommand = Buffer.from(shellCommandb64, 'base64').toString('ascii');
  fs.writeFileSync('./shell.sh', shellCommand);


  await exec.exec('cat', ['./shell.sh']);
  await exec.exec('chmod', ['+x', './shell.sh']);
  await exec.exec('sh', ['./shell.sh']);

  await exec.exec('sh', ['-c', witnessshell]);
};


setup();