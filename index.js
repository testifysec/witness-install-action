const core = require('@actions/core');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');
const fs = require('fs');
const crypto = require('crypto');




async function setup() {


  var os = process.platform;

  switch (os) {
    case 'linux':
      os = 'linux';
      break;
    case 'darwin':
      os = 'darwin';
      break;
    case 'win32':
      os = 'windows';
      break;
    default:
      throw new Error(`Unsupported platform: ${os}`);
  }

  var arch = process.arch;

  switch (arch) {
    case 'x64':
      arch = 'amd64';
      break;
    case 'arm64':
      arch = 'arm64';
      break;
    default:
      throw new Error(`Unsupported architecture: ${arch}`);
  }

  //checksum https://github.com/testifysec/witness/releases/download/v0.1.12-pre-release-4/witness_0.1.12-pre-release-4_checksums.txt
  var version = core.getInput('version');
  //strip the v from the first character of the version if it exists
  if (version.charAt(0) == 'v') {
    version = version.substring(1);
  }


  //https://github.com/testifysec/witness/releases/download/vv0.1.12-pre-release-4/witness_v0.1.12-pre-release-4_linux_amd64.tar.gz

  const downloadUrl = `https://github.com/testifysec/witness/releases/download/v${version}/witness_${version}_${os}_${arch}.tar.gz`;
  const checksumUrl = `https://github.com/testifysec/witness/releases/download/v${version}/witness_${version}_checksums.txt`;

  core.info(`Downloading witness from ${downloadUrl}`);
  core.info(`Downloading witness checksums from ${checksumUrl}`);


  const witness = await tc.downloadTool(downloadUrl);
  const fileBuffer = fs.readFileSync(witness);
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');


  


  //4a45abd867914b4ce41afd88c63ded9aae30bb5c887ab3829bb59b20b8eed695  witness_0.1.12-pre-release-4_windows_arm64.tar.gz
  //verify checksum
  
  const checksum = await tc.downloadTool(checksumUrl);
  var array = fs.readFileSync(checksum).toString().split("\n");


  
  isValidChecksum = false;
  for (i in array) {
    if (array[i].includes(hash)) {
      isValidChecksum = true;
    }
  }

  if (!isValidChecksum) {
    throw new Error(`Checksum mismatch for ${witness}`);
  }


  //extract the tarball
  const witnessDir = await tc.extractTar(witness);

  //add the witness binary to the path
  core.addPath(witnessDir);

  //move the witness binary to home directory
  const home = process.env.HOME;
  const witnessBinary = `${witnessDir}/witness`;

  fs.rename(witnessBinary, `${home}/witness-bin`, (err) => {
    if (err) {
      throw err;
    }
  });

  //add permissions to the binary

  fs.chmod(`${home}/witness-bin`, 0o755, (err) => {
    if (err) {
      throw err;
    }
  });


  setVars(core.getInput('signing-key'));

  //add tool to path
  core.addPath(`${home}/witness-bin`);
  core.addPath(`${home}/witness`);

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
  const home = process.env.HOME;

  //base64 encoding of the shell.sh script
  const shellB64=`IyEgL2Jpbi9iYXNoCgpzZXQgLXgKCgphdHRlc3RhdGlvbnM9JFdJVE5FU1NfQVRURVNUT1JTCmF0dGVzdGF0aW9uc19leHBhbmRlZD0iIgoKIyNzcGxpdCB0aGUgYXR0ZXN0YXRpb25zIGludG8gYW4gYXJyYXkgYXQgc3BhY2UKSUZTPScgJyByZWFkIC1yIC1hIGF0dGVzdGF0aW9uc19hcnJheSA8PDwgIiRhdHRlc3RhdGlvbnMiCgoKIyNlcGFuZCB0aGUgYXR0ZXN0YXRpb25zIGFycmF5IGludG8gYSBzdHJpbmcgd2l0aCBhIHByZWZpeCBvZiAtYQpmb3IgaSBpbiAiJHthdHRlc3RhdGlvbnNfYXJyYXlbQF19IgpkbwogICAgYXR0ZXN0YXRpb25zX2V4cGFuZGVkKz0iIC1hICRpIgpkb25lCgoKd2l0bmVzcy1iaW4gcnVuIFwKLS1hcmNoaXZpc3Qtc2VydmVyPSIke1dJVE5FU1NfQVJDSElWSVNUX0dSUENfU0VSVkVSfSIgXAoke2F0dGVzdGF0aW9uc19leHBhbmRlZH0gXAotaz0iJHtXSVRORVNTX1NJR05JTkdfS0VZfSIgXAotbz0iL2Rldi9udWxsIiBcCi0tdHJhY2U9IiR7V0lUTkVTU19UUkFDRV9FTkFCTEV9IiBcCi1zPSIke1dJVE5FU1NfU1RFUF9OQU1FfSIgXAotLSAiJEAiCg==` 

  const shell = Buffer.from(shellB64, 'base64').toString('ascii');
  const shellFile = fs.createWriteStream(`${home}/witness`);
  shellFile.write(shell);
  shellFile.close();

  //add permissions to the shell script
  fs.chmod(shellFile.path, 0o755, (err) => {
    if (err) {
      throw err;
    }
  }
  );
}

setup();