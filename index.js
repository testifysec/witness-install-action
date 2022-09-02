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
  injectBashrc();
}

async function injectShell() {
  //base64 encoding of the shell.sh script
  const shellB64=`IyEgL2Jpbi9iYXNoCgpzZXQgLXgKCgphdHRlc3RhdGlvbnM9JFdJVE5FU1NfQVRURVNUT1JTCmF0dGVzdGF0aW9uc19leHBhbmRlZD0iIgoKIyNzcGxpdCB0aGUgYXR0ZXN0YXRpb25zIGludG8gYW4gYXJyYXkgYXQgc3BhY2UKSUZTPScgJyByZWFkIC1yIC1hIGF0dGVzdGF0aW9uc19hcnJheSA8PDwgIiRhdHRlc3RhdGlvbnMiCgoKIyNlcGFuZCB0aGUgYXR0ZXN0YXRpb25zIGFycmF5IGludG8gYSBzdHJpbmcgd2l0aCBhIHByZWZpeCBvZiAtYQpmb3IgaSBpbiAiJHthdHRlc3RhdGlvbnNfYXJyYXlbQF19IgpkbwogICAgYXR0ZXN0YXRpb25zX2V4cGFuZGVkKz0iIC1hICRpIgpkb25lCgoKd2l0bmVzcy1iaW4gcnVuIFwKLS1hcmNoaXZpc3Qtc2VydmVyPSIke1dJVE5FU1NfQVJDSElWSVNUX0dSUENfU0VSVkVSfSIgXAoke2F0dGVzdGF0aW9uc19leHBhbmRlZH0gXAotaz0iJHtXSVRORVNTX1NJR05JTkdfS0VZfSIgXAotbz0iL2Rldi9udWxsIiBcCi0tdHJhY2U9IiR7V0lUTkVTU19UUkFDRV9FTkFCTEV9IiBcCi1zPSIke1dJVE5FU1NfU1RFUF9OQU1FfSIgXAotLSAiJEAiCg==` 

  const shell = Buffer.from(shellB64, 'base64').toString('ascii');
  const shellFile = fs.createWriteStream('/home/runner/.local/bin/witness');
  core.addPath('/home/runner/.local/bin');
  shellFile.write(shell);
  shellFile.end();

  exec.exec('chmod', ['+x', '/home/runner/.local/bin/witness']);
  core.info(`Injected shell script into /home/runner/.local/bin/witness`);


}

async function injectBashrc() {
  const script=`c2hlbGwoKSB7CiAgICBUT1BDTUQ9JEAgYmFzaCAtYyAnd2hpbGUgcmVhZCAtcCAiJHtUT1BDTUQjIyovfT4gIiAtcmEgc3ViOyBkbwogICAgICAgIGNhc2UgJHtzdWJbMF06LX0gaW4KICAgICAgICAiIikgY29udGludWU7OwogICAgICAgIGV4aXQpIGV4aXQ7OwogICAgICAgIGVzY2FwZSkgKHNldCAteDsgJHtzdWJbQF06MX0pOzsKICAgICAgICAqKSAoc2V0IC14OyB3aXRuZXNzIC0tICR7VE9QQ01EfSAke3N1YltAXX0pOzsKICAgICAgICBlc2FjCiAgICAgICAgZG9uZScKfQoKc2hlbGwgIiRAIg==`

  const bashrc = Buffer.from(script, 'base64').toString('ascii');

  fs.appendFileSync('/home/runner/.bash_profile', bashrc, function (err) {
    if (err) throw err;
    console.log('Saved!');
  });





}



setup();