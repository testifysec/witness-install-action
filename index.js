const core = require('@actions/core');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');



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

  // Expose the tool by adding it to the PATH
  core.addPath(pathToCLI);
}




async function addShell() {
  await exec.exec('cat', ['./shell.sh']);


  // const witnessshell = String.raw`#!/bin/sh
  // export WITNESS_STEP_NAME="test"
  // shell() {
  //     TOPCMD=$@ bash -c 'while read -p "${TOPCMD##*/}> " -ra sub; do
  //         case ${sub[0]:-} in
  //         "") continue;;
  //         exit) exit;;
  //         escape) (set -x; ${sub[@]:1});;
  //         *) (set -x; witness --step-name=${STEP_NAME} -- ${TOPCMD} ${sub[@]});;
  //         esac
  //         done'
  // }
  // shell "$@"
  // `;

  await exec.exec('sh', ['-c', witnessshell]);
};


setup();