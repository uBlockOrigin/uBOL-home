#!/usr/bin/env bash
#
# This script assumes a linux environment

set -e

echo "*** uBOLite.edge: Creating web store package"

DES=build/uBOLite.edge
rm -rf $DES
mkdir -p $DES

echo "*** uBOLite.edge: Copying reference chromium-based files"
cp -R chromium/* $DES/
rm $DES/log.txt

# Edge store requires that all DNR rulesets are at the root of the package
# https://learn.microsoft.com/answers/questions/918426/cant-update-extension-with-declarative-net-request
echo "*** uBOLite.edge: Modify reference implementation for Edge compatibility"
mv $DES/rulesets/main/* $DES/
rmdir $DES/rulesets/main
# Patch manifest.json
node tools/make-edge.mjs

echo "*** uBOLite.edge: Package done."
