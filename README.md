# Witness Install Action

This action installs the Witness Binary and a Helper Script.

Note:

- Trace only works on Linux amd64.

Eaxmple:


```
on: [push]
jobs:
  hello_world_job:
  
    runs-on: ubuntu-latest
    name: test witness install
    steps:
      - uses: actions/checkout@v3
      - name: Witness install
        uses: testifysec/witness-install-action@main
        with:
          signing-key: |
            -----BEGIN PRIVATE KEY-----
            MC4CAQAwBQYDK2VwBCIEIN2GVZvD5a8M8ALX6ES0NV3zrNzi0ZwZ+DMJQykS92Lc
            -----END PRIVATE KEY-----
          attestors: git environment
          trace-enable: "true"
          step-name: "test"
          archivist-grpc-server: "archivist-grpc.testifysec.io:443"
          version: v0.1.12-pre-release-4
      - run: witness-bin version
      - run: witness ls -al
```
