const fs = require('fs');
const path = require('path');
const { dataDir } = require('../server/config');

function resolveFile(fileName) {
  return path.join(dataDir, fileName);
}

function ensureFile(fileName, defaultValue) {
  const filePath = resolveFile(fileName);
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

function readCollection(fileName, defaultValue = []) {
  ensureFile(fileName, defaultValue);
  const filePath = resolveFile(fileName);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeCollection(fileName, data) {
  const filePath = resolveFile(fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return data;
}

module.exports = {
  ensureFile,
  readCollection,
  writeCollection
};
