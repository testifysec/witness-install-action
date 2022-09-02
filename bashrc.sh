#!/bin/sh

export WITNESS_STEP_NAME="test"

shell() {
    TOPCMD=$@ bash -c 'while read -p "${TOPCMD##*/}> " -ra sub; do
        case ${sub[0]:-} in
        "") continue;;
        exit) exit;;
        escape) (set -x; ${sub[@]:1});;
        *) (set -x; scribe --step-name=${STEP_NAME} -- ${TOPCMD} ${sub[@]});;
        esac
        done'
}

shell "$@"