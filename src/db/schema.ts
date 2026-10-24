import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

// Users table authenticated via Firebase Auth
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tournaments created by debate directors / conveners
export const tournaments = pgTable('tournaments', {
  id: text('id').primaryKey(),
  ownerUid: text('owner_uid').notNull(),
  name: text('name').notNull(),
  format: text('format').notNull().default('WSDC'), // 'WSDC' | 'BP' | 'AP'
  currentRound: integer('current_round').notNull().default(1),
  totalRounds: integer('total_rounds').notNull().default(5),
  prepTimeMinutes: integer('prep_time_minutes').notNull().default(15),
  tournamentData: text('tournament_data').notNull(), // Complete JSON tournament state
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Live Ballots submitted by adjudicators from smartphones / rooms
export const liveBallots = pgTable('live_ballots', {
  id: text('id').primaryKey(),
  tournamentId: text('tournament_id').notNull(),
  roundNumber: integer('round_number').notNull(),
  roomName: text('room_name').notNull(),
  pin: text('pin').notNull(), // 4-digit security PIN for room judges
  chairName: text('chair_name').notNull(),
  govTeamName: text('gov_team_name'),
  oppTeamName: text('opp_team_name'),
  isSubmitted: boolean('is_submitted').notNull().default(false),
  winner: text('winner'),
  ballotPayload: text('ballot_payload'), // JSON representation of scores
  submittedAt: timestamp('submitted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
