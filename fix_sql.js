const fs = require('fs');
const path = require('path');

const targetPath = 'd:\\Android\\Project\\pet-project\\databaes.sql';

try {
  let sql = fs.readFileSync(targetPath, 'utf8');

  // Replace CREATE DATABASE with CREATE DATABASE IF NOT EXISTS
  sql = sql.replace(/CREATE DATABASE\s+(?!IF NOT EXISTS)(\w+)/gi, 'CREATE DATABASE IF NOT EXISTS $1');

  // Replace CREATE TABLE with CREATE TABLE IF NOT EXISTS
  sql = sql.replace(/CREATE TABLE\s+(?!IF NOT EXISTS)/gi, 'CREATE TABLE IF NOT EXISTS ');

  // Replace INSERT INTO with INSERT IGNORE INTO
  sql = sql.replace(/INSERT INTO\s+/gi, 'INSERT IGNORE INTO ');

  fs.writeFileSync(targetPath, sql, 'utf8');
  console.log('Successfully updated the SQL file in the workspace.');
} catch (error) {
  console.error('Error modifying file:', error);
}
