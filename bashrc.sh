#!/bin/sh

use_prefix () {
    while read -p "$* >" -ra c; do
        [ "${c[0]}" = "exit" ] && break
        "$@" "${c[@]}"
    done
}

use_


shell "$@"