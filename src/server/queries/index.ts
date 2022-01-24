import * as path from 'path';
import * as fs from 'fs';

const listOfUsersByChatsPath = path.join(__dirname, '..', '..', '..', 'raw-queries', 'listOfUsersByChats.sql');
const listOfUsersByChatsCountPath = path.join(__dirname, '..', '..', '..', 'raw-queries', 'listOfUsersByChatsCount.sql');

export const listOfUsersByChatsQuery = fs.readFileSync(listOfUsersByChatsPath).toString();
export const listOfUsersByChatsCountQuery = fs.readFileSync(listOfUsersByChatsCountPath).toString();
