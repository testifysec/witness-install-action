const core = require("@actions/core");
const exec = require("@actions/exec");
const tc = require("@actions/tool-cache");
const fs = require("fs");
const crypto = require("crypto");
const YAML = require('yaml')

async function setup() {
  var os = process.platform;

  switch (os) {
    case "linux":
      os = "linux";
      break;
    case "darwin":
      os = "darwin";
      break;
    case "win32":
      os = "windows";
      break;
    default:
      throw new Error(`Unsupported platform: ${os}`);
  }

  var arch = process.arch;

  switch (arch) {
    case "x64":
      arch = "amd64";
      break;
    case "arm64":
      arch = "arm64";
      break;
    default:
      throw new Error(`Unsupported architecture: ${arch}`);
  }

  var version = core.getInput("version");

  if (version.charAt(0) == "v") {
    version = version.substring(1);
  }


  const downloadUrl = `https://github.com/testifysec/witness/releases/download/v${version}/witness_${version}_${os}_${arch}.tar.gz`;
  const checksumUrl = `https://github.com/testifysec/witness/releases/download/v${version}/witness_${version}_checksums.txt`;

  core.info(`Downloading witness from ${downloadUrl}`);
  core.info(`Downloading witness checksums from ${checksumUrl}`);

  const witness = await tc.downloadTool(downloadUrl);
  const fileBuffer = fs.readFileSync(witness);
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

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
  core.info(`Extracting witness to ${process.env.RUNNER_TEMP}`);
  const witnessDir = await tc.extractTar(witness);

  //move the witness binary to dir directory

  const dir = process.env.RUNNER_TEMP;
  const witnessBinary = `${witnessDir}/witness`;

  core.info(`Moving witness binary to ${dir}`);
  fs.rename(witnessBinary, `${dir}/witness-bin`, function (err) {
    if (err) {
      throw new Error(`Error moving witness binary: ${err}`);
    }
    core.info(`Successfully moved witness binary to ${dir}/witness-bin`);
  });

  core.info(`Writing Key to File`);
  writeKey(core.getInput("signing-key"), dir);



  core.info(`Injecting Shell`);
  await injectShell(`${dir}/witness`);

  //make script witness executable with fs.chmod
  fs.chmod(`${dir}/witness`, 0o755, function (err) {
    if (err) {
      throw new Error(`Error making witness executable: ${err}`);
    }
    core.info(`Successfully made witness helper script executable`);
  });

  //make script witness executable with fs.chmod
  fs.chmod(`${dir}/witness-bin`, 0o755, function (err) {
    if (err) {
      throw new Error(`Error making witness-bin executable: ${err}`);
    }
    core.info(`Successfully made witness executable`);
  });


  const keyLocation = `${dir}/key.pem`;
  archivistGRPCServer = core.getInput("archivist-grpc-server");
  attestors = core.getInput("attestors");
  attestations = attestors.split(",");
  traceEnable = core.getInput("trace-enable")
  stepName = core.getInput("step-name")
  outfile = `/dev/null`

  await writeConfigFile(dir, archivistGRPCServer, attestors, keyLocation, traceEnable, stepName, outfile);

  //add tool to path
  core.addPath(`${dir}`);
}

function writeKey(key, dir) {
  const keyFile = fs.createWriteStream(`${dir}/key.pem`);
  keyFile.write(key);
  keyFile.close();

  core.info(`Successfully wrote key to ${dir}/key.pem`);
}

async function injectShell(path) {
  const script = `
  #! /bin/bash
  set -e
  set -x
  echo "Running witness with config:"
  cat $RUNNER_TEMP/.witness.yaml
  witness-bin -c $RUNNER_TEMP/.witness.yaml run -- "$@"
  `; 

  const shellFile = fs.createWriteStream(path);

  core.info(`Writing shell to ${path}`);
  shellFile.write(script);
  shellFile.close();

  //wait 100ms
  await new Promise((r) => setTimeout(r, 100));
}

async function writeConfigFile(dir, archivistGRPCServer, attestations, keyLocation, traceEnable, stepName, outfile) {
  const config = {
    run : {
      "archivist-grpc": archivistGRPCServer,
      "attestations": attestations,
      "key": keyLocation,
      "trace": traceEnable,
      "step": stepName,
      "outfile": outfile,
    },
  };

  core.info(`Writing config with options ${JSON.stringify(config)}`);

  const configFile = fs.createWriteStream(`${dir}/.witness.yaml`);
  configFile.write(YAML.stringify(config));
  configFile.close();
}

setup();

