const core = require("@actions/core");
const exec = require("@actions/exec");
const tc = require("@actions/tool-cache");
const fs = require("fs");
const crypto = require("crypto");
const { time } = require("console");

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

  core.info(`Setting variables`);
  setVars(core.getInput("signing-key"));

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

  //add tool to path
  core.addPath(`${dir}`);
}

function setVars(key) {
  //write the key to a temp file
  const keyFile = fs.createWriteStream("../key.pem");
  keyFile.write(key);
  keyFile.close();

  //get working directory
  const cwd = process.cwd();

  //get directory one level up
  const parent = cwd.split("/").slice(0, -1).join("/");

  //set the env var
  core.exportVariable("WITNESS_SIGNING_KEY", `${parent}/key.pem`);

  stepName = core.getInput("step-name");
  core.exportVariable("WITNESS_STEP_NAME", stepName);

  traceEnable = core.getInput("trace-enable");
  if (traceEnable == "true") {
    core.exportVariable("WITNESS_TRACE_ENABLE", "true");
  } else {
    core.exportVariable("WITNESS_TRACE_ENABLE", "false");
  }

  archivistGRPCServer = core.getInput("archivist-grpc-server");
  core.exportVariable("WITNESS_ARCHIVIST_GRPC_SERVER", archivistGRPCServer);

  attestors = core.getInput("attestors");
  core.exportVariable("WITNESS_ATTESTORS", attestors);
}

async function injectShell(path) {
  //base64 encoding of the shell.sh script
  const shellB64 = `IyEgL2Jpbi9iYXNoCnNldCAtZQoKYXR0ZXN0YXRpb25zPSRXSVRORVNTX0FUVEVTVE9SUwphdHRlc3RhdGlvbnNfZXhwYW5kZWQ9IiIKCiMjc3BsaXQgdGhlIGF0dGVzdGF0aW9ucyBpbnRvIGFuIGFycmF5IGF0IHNwYWNlCklGUz0nICcgcmVhZCAtciAtYSBhdHRlc3RhdGlvbnNfYXJyYXkgPDw8ICIkYXR0ZXN0YXRpb25zIgoKCiMjZXBhbmQgdGhlIGF0dGVzdGF0aW9ucyBhcnJheSBpbnRvIGEgc3RyaW5nIHdpdGggYSBwcmVmaXggb2YgLWEKZm9yIGkgaW4gIiR7YXR0ZXN0YXRpb25zX2FycmF5W0BdfSIKZG8KICAgIGF0dGVzdGF0aW9uc19leHBhbmRlZCs9IiAtYSAkaSIKZG9uZQoKCndpdG5lc3MtYmluIHJ1biBcCi0tYXJjaGl2aXN0LWdycGM9IiR7V0lUTkVTU19BUkNISVZJU1RfR1JQQ19TRVJWRVJ9IiBcCiR7YXR0ZXN0YXRpb25zX2V4cGFuZGVkfSBcCi1rPSIke1dJVE5FU1NfU0lHTklOR19LRVl9IiBcCi1vPSIvZGV2L251bGwiIFwKLS10cmFjZT0iJHtXSVRORVNTX1RSQUNFX0VOQUJMRX0iIFwKLXM9IiR7V0lUTkVTU19TVEVQX05BTUV9IiBcCi0tICIkQCI=`;
  const shell = Buffer.from(shellB64, "base64").toString("ascii");
  const shellFile = fs.createWriteStream(path);

  core.info(`Writing shell to ${path}`);
  shellFile.write(shell);
  shellFile.close();

  //wait 100ms
  await new Promise((r) => setTimeout(r, 100));
}

setup();
