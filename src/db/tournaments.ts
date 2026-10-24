import { db } from './index.ts';
import { tournaments, liveBallots, users } from './schema.ts';
import { eq, and } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, name?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length > 0) {
      return existing[0];
    }
    const inserted = await db.insert(users).values({ uid, email, name }).returning();
    return inserted[0];
  } catch (err) {
    console.error('getOrCreateUser error:', err);
    throw new Error('Failed to synchronize user record', { cause: err });
  }
}

export async function saveTournament(tournamentData: any, ownerUid: string) {
  try {
    const id = tournamentData.id;
    const existing = await db.select().from(tournaments).where(eq(tournaments.id, id)).limit(1);

    if (existing.length > 0) {
      const updated = await db
        .update(tournaments)
        .set({
          name: tournamentData.name,
          format: tournamentData.format,
          currentRound: tournamentData.currentRound,
          totalRounds: tournamentData.totalRounds,
          prepTimeMinutes: tournamentData.prepTimeMinutes,
          tournamentData: JSON.stringify(tournamentData),
          updatedAt: new Date(),
        })
        .where(eq(tournaments.id, id))
        .returning();
      return updated[0];
    } else {
      const inserted = await db
        .insert(tournaments)
        .values({
          id,
          ownerUid,
          name: tournamentData.name,
          format: tournamentData.format,
          currentRound: tournamentData.currentRound,
          totalRounds: tournamentData.totalRounds,
          prepTimeMinutes: tournamentData.prepTimeMinutes,
          tournamentData: JSON.stringify(tournamentData),
        })
        .returning();
      return inserted[0];
    }
  } catch (err) {
    console.error('saveTournament error:', err);
    throw new Error('Failed to save tournament to database', { cause: err });
  }
}

export async function getTournamentById(id: string) {
  try {
    const records = await db.select().from(tournaments).where(eq(tournaments.id, id)).limit(1);
    if (records.length === 0) return null;
    return JSON.parse(records[0].tournamentData);
  } catch (err) {
    console.error('getTournamentById error:', err);
    throw new Error('Failed to retrieve tournament', { cause: err });
  }
}

export async function publishLiveBallotSlots(
  tournamentId: string,
  roundNumber: number,
  pairings: any[],
  teams: any[],
  adjudicators: any[]
) {
  try {
    const results = [];
    for (const p of pairings) {
      const ballotId = `${tournamentId}-r${roundNumber}-${p.id}`;
      const govTeam = teams.find((t: any) => t.id === p.govTeamId);
      const oppTeam = teams.find((t: any) => t.id === p.oppTeamId);
      const chair = adjudicators.find((a: any) => a.id === p.chairId);

      // Generate consistent 4-digit PIN for this room
      const pin = p.pin || Math.floor(1000 + Math.random() * 9000).toString();

      const existing = await db.select().from(liveBallots).where(eq(liveBallots.id, ballotId)).limit(1);

      if (existing.length === 0) {
        const inserted = await db
          .insert(liveBallots)
          .values({
            id: ballotId,
            tournamentId,
            roundNumber,
            roomName: p.roomName,
            pin,
            chairName: chair?.name || 'Chair Adjudicator',
            govTeamName: govTeam?.name || 'Proposition',
            oppTeamName: oppTeam?.name || 'Opposition',
            isSubmitted: p.ballotSubmitted || false,
            winner: p.wsdcBallot?.winner || null,
            ballotPayload: p.wsdcBallot ? JSON.stringify(p.wsdcBallot) : null,
          })
          .returning();
        results.push(inserted[0]);
      } else {
        results.push(existing[0]);
      }
    }
    return results;
  } catch (err) {
    console.error('publishLiveBallotSlots error:', err);
    throw new Error('Failed to publish live ballot slots', { cause: err });
  }
}

export async function getLiveBallotsForRound(tournamentId: string, roundNumber: number) {
  try {
    return await db
      .select()
      .from(liveBallots)
      .where(and(eq(liveBallots.tournamentId, tournamentId), eq(liveBallots.roundNumber, roundNumber)));
  } catch (err) {
    console.error('getLiveBallotsForRound error:', err);
    throw new Error('Failed to fetch live ballots', { cause: err });
  }
}

export async function submitLiveBallot(ballotId: string, pin: string, ballotData: any) {
  try {
    const record = await db.select().from(liveBallots).where(eq(liveBallots.id, ballotId)).limit(1);
    if (record.length === 0) {
      throw new Error('Ballot room not found');
    }
    if (record[0].pin !== pin) {
      throw new Error('Invalid room PIN. Please check the PIN provided by the Tab Director.');
    }

    const updated = await db
      .update(liveBallots)
      .set({
        isSubmitted: true,
        winner: ballotData.winner,
        ballotPayload: JSON.stringify(ballotData),
        submittedAt: new Date(),
      })
      .where(eq(liveBallots.id, ballotId))
      .returning();

    return updated[0];
  } catch (err) {
    console.error('submitLiveBallot error:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to submit ballot', { cause: err });
  }
}
