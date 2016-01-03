#!/bin/bash
cd `dirname $0`

if [ ! -d OpenDSA ]
then
  git clone --recursive https://github.com/OpenDSA/OpenDSA.git
fi

cd OpenDSA
make pull

cd ..
uglifyjs A_plus_submission.js >> OpenDSA/lib/odsaAV-min.js
