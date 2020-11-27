#!/bin/bash
read -p 'How many values would you like to convert to base64? (1-n): ' COUNT
if [ ${COUNT} -gt 0 ]; then
    COUNTER=0
    until [ ${COUNTER} -eq ${COUNT} ]; do
        read -p 'Conversion '$((COUNTER+1))', enter the text you want converted to base64: ' WORD
        echo 'Base64 output: '$(echo -n ${WORD} | base64 )
        ((COUNTER+=1))
    done
else
    echo "Invalid value!"
    exit
fi