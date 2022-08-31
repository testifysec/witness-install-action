const core = require('@actions/core');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');
const fs = require('fs');



async function setup() {
  const witnessURL = core.getInput('download-url');
    // Extract the tarball onto the runner
  const pathToCLI = await tc.downloadTool(witnessURL, "/home/runner/.local/bin/witness-bin");
  const path = "/home/runner/.local/bin/witness-bin"

  exec.exec('chmod', ['+x', path]);
  core.info(`Extracted witness to ${path}`);
  setVars(core.getInput('signing-key'));

  // Expose the tool by adding it to the PATH
  core.addPath("/home/runner/.local/bin");
}


async function setVars(key) {
  //write the key to a temp file
  const keyFile = fs.createWriteStream('../key.pem');
  keyFile.write(key);

  //get working directory
  const cwd = process.cwd();

  //get directory one level up
  const parent = cwd.split('/').slice(0, -1).join('/');

  //set the env var
  core.exportVariable('WITNESS_SIGNING_KEY', `${parent}/key.pem`);
    
  stepName = core.getInput('step-name');
  core.exportVariable('WITNESS_STEP_NAME', stepName);

  traceEnable = core.getInput('trace-enable');
  if (traceEnable == 'true') {
    core.exportVariable('WITNESS_TRACE_ENABLE', 'true');
  } else {
    core.exportVariable('WITNESS_TRACE_ENABLE', 'false');
  }

  archivistGRPCServer = core.getInput('archivist-grpc-server');
  core.exportVariable('WITNESS_ARCHIVIST_GRPC_SERVER', archivistGRPCServer);

  attestors = core.getInput('attestors');
  core.exportVariable('WITNESS_ATTESTORS', attestors);

  injectShell();
}

async function injectShell() {
  //base64 encoding of the shell.sh script
  const shellB64=`IyEgL2Jpbi9iYXNoCgpzZXQgLXgKc2V0IC1lCgoKCgphdHRlc3RhdGlvbnM9JFdJVE5FU1NfQVRURVNUT1JTCmF0dGVzdGF0aW9uc19leHBhbmRlZD0iIgoKIyNzcGxpdCB0aGUgYXR0ZXN0YXRpb25zIGludG8gYW4gYXJyYXkgYXQgc3BhY2UKSUZTPScgJyByZWFkIC1yIC1hIGF0dGVzdGF0aW9uc19hcnJheSA8PDwgIiRhdHRlc3RhdGlvbnMiCgoKIyNlcGFuZCB0aGUgYXR0ZXN0YXRpb25zIGFycmF5IGludG8gYSBzdHJpbmcgd2l0aCBhIHByZWZpeCBvZiAtYQpmb3IgaSBpbiAiJHthdHRlc3RhdGlvbnNfYXJyYXlbQF19IgpkbwogICAgYXR0ZXN0YXRpb25zX2V4cGFuZGVkKz0iIC1hICRpIgpkb25lCgoKd2l0bmVzcy1iaW4gcnVuIC0tc3RlcC1uYW1lPSIke1dJVE5FU1NfU1RFUF9OQU1FfSIgXAotLWFyY2hpdmlzdC1zZXJ2ZXI9IiR7V0lUTkVTU19BUkNISVZJU1RfR1JQQ19TRVJWRVJ9IiBcCiR7YXR0ZXN0YXRpb25zX2V4cGFuZGVkfSBcCi1rPSIke1dJVE5FU1NfU0lHTklOR19LRVl9IiBcCi1vPSIvZGV2L251bGwiIFwKLS10cmFjZT0iJHtXSVRORVNTX1RSQUNFX0VOQUJMRX0iIFwKLS1zdGVwPSIke1dJVE5FU1NfU1RFUF9OQU1FfSIgXAotLSAiJEAi` 

  const shell = Buffer.from(shellB64, 'base64').toString('ascii');
  const shellFile = fs.createWriteStream('/home/runner/.local/bin/witness');
  core.addPath('/home/runner/.local/bin');
  shellFile.write(shell);
  shellFile.end();

  exec.exec('chmod', ['+x', '/home/runner/.local/bin/witness']);
  core.info(`Injected shell script into /home/runner/.local/bin/witness`);


}




setup();