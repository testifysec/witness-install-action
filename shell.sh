#! /bin/bash
set -e

attestations=$WITNESS_ATTESTORS
attestations_expanded=""

##split the attestations into an array at space
IFS=' ' read -r -a attestations_array <<< "$attestations"


##epand the attestations array into a string with a prefix of -a
for i in "${attestations_array[@]}"
do
    attestations_expanded+=" -a $i"
done

##check if the trace is enabled
if [ "$WITNESS_TRACE_ENABLE" = true ] ; then
    echo "Trace is enabled"
    witness-bin run \
    --archivist-grpc="${WITNESS_ARCHIVIST_GRPC_SERVER}" \
    ${attestations_expanded} \
    -k="${WITNESS_SIGNING_KEY}" \
    -o="/dev/null" \
    --trace \
    -s="${WITNESS_STEP_NAME}" \
    -- "$@"

else
    echo "Trace is disabled"
    witness-bin run \
    --archivist-grpc="${WITNESS_ARCHIVIST_GRPC_SERVER}" \
    ${attestations_expanded} \
    -k="${WITNESS_SIGNING_KEY}" \
    -o="/dev/null" \
    -s="${WITNESS_STEP_NAME}" \
    -- "$@"
fi