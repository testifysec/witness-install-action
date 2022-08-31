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
  const pathToCLI = await tc.downloadTool(witnessURL, "/home/runner/.local/bin/witness");
  const path = "/home/runner/.local/bin/witness"

  exec.exec('chmod', ['+x', path]);
  core.info(`Extracted witness to ${path}`);
  createWitnessConfigYaml(core.getInput('signing-key'));

  // Expose the tool by adding it to the PATH
  core.addPath(path);
}


async function createWitnessConfigYaml(key) {
  //write the key to a temp file
  const keyFile = fs.createWriteStream('./key.pem');
  keyFile.write(key);

  //create the config file
  const config = {
    "run": {
      "key": "key.pem",
      "trace": "true",
    }
  }
  fs.writeFileSync('./.witness.yaml', JSON.stringify(config));
}




setup();