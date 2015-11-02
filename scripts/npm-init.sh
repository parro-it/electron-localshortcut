#!/bin/sh
npm version patch &&
npm link &&
npm publish &&
git push --follow-tags
