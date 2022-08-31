#! /bin/bash

set -x


attestations=$WITNESS_ATTESTORS
attestations_expanded=""

##split the attestations into an array at space
IFS=' ' read -r -a attestations_array <<< "$attestations"


##epand the attestations array into a string with a prefix of -a
for i in "${attestations_array[@]}"
do
    attestations_expanded+=" -a $i"
done


witness-bin run \
--archivist-server="${WITNESS_ARCHIVIST_GRPC_SERVER}" \
${attestations_expanded} \
-k="${WITNESS_SIGNING_KEY}" \
-o="/dev/null" \
--trace="${WITNESS_TRACE_ENABLE}" \
-s="${WITNESS_STEP_NAME}" \
-- "$@"
