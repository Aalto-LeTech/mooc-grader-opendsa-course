OpenDSA exercises served in mooc-grader
---------------------------------------

OpenDSA is an eTextbook project for Data Structures and Algorithms.
This repository includes the OpenDSA repository as a git submodule.
http://algoviz.org/OpenDSA/
https://github.com/OpenDSA/OpenDSA

This repository can be cloned to mooc-grader for serving OpenDSA exercises
for A+ learning environment.
https://github.com/Aalto-LeTech/mooc-grader
https://github.com/Aalto-LeTech/a-plus

### Note: see `build.sh` to

1. Checkout the OpenDSA as a submodule
2. Build the OpenDSA internals
3. Amend the OpenDSA with Ajax submit

### Note: problem with current OpenDSA code

In `lib/odsaUtils.js` or `lib/odsaUtils-min.js` lines 751-762 the code is
trying to fix code URLs and is broken for the required exercises. Temporary
solution is to comment that block out.
