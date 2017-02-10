#!/bin/bash
cd `dirname $0`

if [ ! -d OpenDSA ]
then
  git submodule init
  git submodule update
  cd OpenDSA
  git checkout master
  cd ..
fi

cd OpenDSA
make pull

cd ..
cat md5.min.js >> OpenDSA/lib/odsaAV-min.js
uglifyjs ajaxsubmit.js --mangle >> OpenDSA/lib/odsaAV-min.js
