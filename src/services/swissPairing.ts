import { Team, Adjudicator, Pairing, Round, DebateFormat } from '../types/tournament';

export function generateSwissPairings(
  roundNumber: number,
  format: DebateFormat,
  teams: Team[],
  adjudicators: Adjudicator[],
  previousRounds: Round[]
): Pairing[] {
  if (teams.length < 2) return [];

  // Clone teams for safe sorting
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.totalSpeakerScore - a.totalSpeakerScore;
  });

  const pairings: Pairing[] = [];
  const assignedTeamIds = new Set<string>();

  // Filter available judges and sort by ranking (highest rank = top chairs)
  const availableJudges = [...adjudicators].sort((a, b) => b.score - a.score);
  let judgeIndex = 0;

  if (format === 'BP') {
    // BP: 4 teams per room
    const roomsCount = Math.floor(sortedTeams.length / 4);
    
    // Group into chunks of 4
    for (let r = 0; r < roomsCount; r++) {
      const roomTeams = sortedTeams.slice(r * 4, (r + 1) * 4);
      if (roomTeams.length < 4) break;

      // Assign sides (OG, OO, CG, CO) balancing previous positions
      const [og, oo, cg, co] = roomTeams;

      // Assign chair and panellists avoiding clashes
      const assignedJudges: string[] = [];
      let chairId = '';

      for (let j = 0; j < availableJudges.length; j++) {
        const candidate = availableJudges[(judgeIndex + j) % availableJudges.length];
        const hasClash = roomTeams.some(
          t => candidate.institutionClashes.includes(t.institution) || candidate.teamClashes.includes(t.id)
        );

        if (!hasClash && !assignedJudges.includes(candidate.id)) {
          if (!chairId) {
            chairId = candidate.id;
          }
          assignedJudges.push(candidate.id);
          if (assignedJudges.length >= 2) break; // 1 chair + 1 panelist
        }
      }

      if (!chairId && availableJudges.length > 0) {
        chairId = availableJudges[0].id;
        assignedJudges.push(chairId);
      }

      judgeIndex += assignedJudges.length;

      pairings.push({
        id: `round-${roundNumber}-room-${r + 1}`,
        roomName: `Chamber ${String.fromCharCode(65 + r)}`,
        roundNumber,
        bpTeamIds: {
          og: og.id,
          oo: oo.id,
          cg: cg.id,
          co: co.id,
        },
        judgeIds: assignedJudges,
        chairId,
        ballotSubmitted: false,
      });
    }

    return pairings;
  }

  // WSDC / 2-Team Formats: Swiss Power-pairing (High vs High in bracket)
  // Group by bracket (points)
  const brackets: Map<number, Team[]> = new Map();
  for (const team of sortedTeams) {
    if (!brackets.has(team.points)) {
      brackets.set(team.points, []);
    }
    brackets.get(team.points)!.push(team);
  }

  const pointKeys = Array.from(brackets.keys()).sort((a, b) => b - a);
  let pullupPool: Team[] = [];
  let roomCounter = 1;

  for (let k = 0; k < pointKeys.length; k++) {
    const pts = pointKeys[k];
    let currentBracket = [...pullupPool, ...(brackets.get(pts) || [])];
    pullupPool = [];

    // If odd number in bracket, pull down the lowest ranked team with least pullups
    if (currentBracket.length % 2 !== 0 && k < pointKeys.length - 1) {
      currentBracket.sort((a, b) => {
        if (a.pullupsCount !== b.pullupsCount) return a.pullupsCount - b.pullupsCount;
        return a.totalSpeakerScore - b.totalSpeakerScore;
      });
      const pullDown = currentBracket.pop()!;
      pullDown.pullupsCount += 1;
      pullupPool.push(pullDown);
    }

    // Now pair within bracket (High vs Low within bracket or High vs High)
    // Standard debate Swiss: Fold or Slide pairing
    const half = Math.floor(currentBracket.length / 2);
    for (let i = 0; i < half; i++) {
      const teamA = currentBracket[i];
      // Try to find an opponent teamA hasn't debated yet
      let opponentIndex = half + i;
      for (let cand = half; cand < currentBracket.length; cand++) {
        if (!teamA.pastOpponentIds.includes(currentBracket[cand].id)) {
          opponentIndex = cand;
          break;
        }
      }

      const teamB = currentBracket.splice(opponentIndex, 1)[0] || currentBracket[half];
      if (!teamB) continue;

      // Side balance: who has done Gov less?
      const aGovCount = teamA.historySides.filter(s => s === 'Gov').length;
      const bGovCount = teamB.historySides.filter(s => s === 'Gov').length;

      let govTeam = teamA;
      let oppTeam = teamB;
      if (aGovCount > bGovCount) {
        govTeam = teamB;
        oppTeam = teamA;
      } else if (aGovCount === bGovCount && Math.random() > 0.5) {
        govTeam = teamB;
        oppTeam = teamA;
      }

      // Adjudicator allocation
      const assignedJudges: string[] = [];
      let chairId = '';

      for (let j = 0; j < availableJudges.length; j++) {
        const candidate = availableJudges[(judgeIndex + j) % availableJudges.length];
        const hasClash =
          candidate.institutionClashes.includes(govTeam.institution) ||
          candidate.institutionClashes.includes(oppTeam.institution) ||
          candidate.teamClashes.includes(govTeam.id) ||
          candidate.teamClashes.includes(oppTeam.id);

        if (!hasClash && !assignedJudges.includes(candidate.id)) {
          if (!chairId) chairId = candidate.id;
          assignedJudges.push(candidate.id);
          if (assignedJudges.length >= 1) break;
        }
      }

      if (!chairId && availableJudges.length > 0) {
        chairId = availableJudges[0].id;
        assignedJudges.push(chairId);
      }

      judgeIndex += assignedJudges.length;

      pairings.push({
        id: `round-${roundNumber}-room-${roomCounter}`,
        roomName: `Debate Hall ${roomCounter}`,
        roundNumber,
        govTeamId: govTeam.id,
        oppTeamId: oppTeam.id,
        judgeIds: assignedJudges,
        chairId,
        ballotSubmitted: false,
      });

      roomCounter++;
    }
  }

  return pairings;
}
