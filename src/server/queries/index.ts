import * as fs from 'fs';
import * as path from 'path';

const listOfUsersByChatsPath = path.join(__dirname, '..', '..', '..', 'raw-queries', 'listOfUsersByChats.sql');
const listOfUsersByChatsCountPath = path.join(__dirname, '..', '..', '..', 'raw-queries', 'listOfUsersByChatsCount.sql');

const referralProgramClaimAndPaidEventsPath = path.join(__dirname, '..', '..', '..', 'raw-queries', 'referralProgramClaimAndPaidEvents.sql');
const referralProgramClaimAndPaidEventsCountPath = path.join(__dirname, '..', '..', '..', 'raw-queries', 'referralProgramClaimAndPaidEventsCount.sql');

export const referralProgramClaimAndPaidEventsQuery = fs.readFileSync(referralProgramClaimAndPaidEventsPath).toString();
export const referralProgramClaimAndPaidEventsCountQuery = fs.readFileSync(referralProgramClaimAndPaidEventsCountPath).toString();

export const listOfUsersByChatsQuery = fs.readFileSync(listOfUsersByChatsPath).toString();
export const listOfUsersByChatsCountQuery = fs.readFileSync(listOfUsersByChatsCountPath).toString();
