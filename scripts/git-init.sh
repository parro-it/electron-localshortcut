#!/bin/sh
gh re --new electron-localshortcut --description  &&

git init &&

git remote add origin https://github.com/parro-it/electron-localshortcut.git &&

joe sublimetext node > .gitignore &&
echo '\nprivate\ninit\n' >> .gitignore &&

git add .  &&
git commit -m "project skeleton" &&
git push --set-upstream origin master

