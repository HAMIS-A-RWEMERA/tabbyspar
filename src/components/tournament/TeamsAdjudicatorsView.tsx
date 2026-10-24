import React, { useState } from 'react';
import { Users, UserPlus, ShieldAlert, Plus, Trash2 } from 'lucide-react';
import { Tournament, Team, Adjudicator } from '../../types/tournament';

interface TeamsAdjudicatorsViewProps {
  tournament: Tournament;
  onUpdateTournament: (updated: Tournament) => void;
}

export const TeamsAdjudicatorsView: React.FC<TeamsAdjudicatorsViewProps> = ({
  tournament,
  onUpdateTournament,
}) => {
  const [activeTab, setActiveTab] = useState<'teams' | 'judges'>('teams');

  // Form states for adding team
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamInstitution, setNewTeamInstitution] = useState('');
  const [speaker1, setSpeaker1] = useState('');
  const [speaker2, setSpeaker2] = useState('');
  const [speaker3, setSpeaker3] = useState('');
  const [showAddTeam, setShowAddTeam] = useState(false);

  // Form states for adding judge
  const [newJudgeName, setNewJudgeName] = useState('');
  const [newJudgeInstitution, setNewJudgeInstitution] = useState('');
  const [newJudgeScore, setNewJudgeScore] = useState(8.0);
  const [newJudgeClashes, setNewJudgeClashes] = useState('');
  const [showAddJudge, setShowAddJudge] = useState(false);

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const newTeam: Team = {
      id: `t-${Date.now()}`,
      name: newTeamName,
      institution: newTeamInstitution || 'Independent',
      points: 0,
      totalSpeakerScore: 0,
      pullupsCount: 0,
      historySides: [],
      pastOpponentIds: [],
      speakers: [
        { id: `sp-${Date.now()}-1`, name: speaker1 || 'Speaker 1', isNovice: false },
        { id: `sp-${Date.now()}-2`, name: speaker2 || 'Speaker 2', isNovice: false },
        { id: `sp-${Date.now()}-3`, name: speaker3 || 'Speaker 3', isNovice: false },
      ],
    };

    onUpdateTournament({
      ...tournament,
      teams: [...tournament.teams, newTeam],
    });

    setNewTeamName('');
    setNewTeamInstitution('');
    setSpeaker1('');
    setSpeaker2('');
    setSpeaker3('');
    setShowAddTeam(false);
  };

  const handleAddJudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudgeName.trim()) return;

    const clashes = newJudgeClashes
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const newJudge: Adjudicator = {
      id: `adj-${Date.now()}`,
      name: newJudgeName,
      institution: newJudgeInstitution || 'Independent',
      score: newJudgeScore,
      isChair: newJudgeScore >= 8.0,
      institutionClashes: clashes,
      teamClashes: [],
    };

    onUpdateTournament({
      ...tournament,
      adjudicators: [...tournament.adjudicators, newJudge],
    });

    setNewJudgeName('');
    setNewJudgeInstitution('');
    setNewJudgeScore(8.0);
    setNewJudgeClashes('');
    setShowAddJudge(false);
  };

  const handleDeleteTeam = (id: string) => {
    onUpdateTournament({
      ...tournament,
      teams: tournament.teams.filter(t => t.id !== id),
    });
  };

  const handleDeleteJudge = (id: string) => {
    onUpdateTournament({
      ...tournament,
      adjudicators: tournament.adjudicators.filter(a => a.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'teams' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Registered Teams ({tournament.teams.length})
          </button>
          <button
            onClick={() => setActiveTab('judges')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'judges' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Adjudicators & Clashes ({tournament.adjudicators.length})
          </button>
        </div>

        <div>
          {activeTab === 'teams' ? (
            <button
              onClick={() => setShowAddTeam(!showAddTeam)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Register New Team
            </button>
          ) : (
            <button
              onClick={() => setShowAddJudge(!showAddJudge)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Adjudicator
            </button>
          )}
        </div>
      </div>

      {/* ADD TEAM FORM */}
      {showAddTeam && (
        <form onSubmit={handleAddTeam} className="bg-slate-900 border border-indigo-500/30 rounded-xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-white">Add New Debate Team</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Team Name</label>
              <input
                type="text"
                required
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="e.g. Oxford Union Alpha"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Institution / School</label>
              <input
                type="text"
                value={newTeamInstitution}
                onChange={e => setNewTeamInstitution(e.target.value)}
                placeholder="e.g. Oxford University"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Speaker 1</label>
              <input
                type="text"
                value={speaker1}
                onChange={e => setSpeaker1(e.target.value)}
                placeholder="First Speaker"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Speaker 2</label>
              <input
                type="text"
                value={speaker2}
                onChange={e => setSpeaker2(e.target.value)}
                placeholder="Second Speaker"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Speaker 3</label>
              <input
                type="text"
                value={speaker3}
                onChange={e => setSpeaker3(e.target.value)}
                placeholder="Third Speaker"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddTeam(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
            >
              Save Team
            </button>
          </div>
        </form>
      )}

      {/* ADD JUDGE FORM */}
      {showAddJudge && (
        <form onSubmit={handleAddJudge} className="bg-slate-900 border border-indigo-500/30 rounded-xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-white">Add Adjudicator & Accreditation</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Judge Name</label>
              <input
                type="text"
                required
                value={newJudgeName}
                onChange={e => setNewJudgeName(e.target.value)}
                placeholder="e.g. Maya Chen"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Institution</label>
              <input
                type="text"
                value={newJudgeInstitution}
                onChange={e => setNewJudgeInstitution(e.target.value)}
                placeholder="e.g. Harvard Debating Union"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Ranking Score (1 - 10)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={newJudgeScore}
                onChange={e => setNewJudgeScore(parseFloat(e.target.value) || 8.0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Institutional Clashes (comma separated)
            </label>
            <input
              type="text"
              value={newJudgeClashes}
              onChange={e => setNewJudgeClashes(e.target.value)}
              placeholder="e.g. Oxford University, Team Canada Red"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddJudge(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
            >
              Save Adjudicator
            </button>
          </div>
        </form>
      )}

      {/* TEAMS LIST */}
      {activeTab === 'teams' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tournament.teams.map(team => (
            <div
              key={team.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">{team.name}</h4>
                    <span className="text-xs text-slate-400">{team.institution}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                    Speakers Roster
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {team.speakers.map(s => (
                      <span
                        key={s.id}
                        className="text-xs text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
                      >
                        {s.name} {s.isNovice && '(Novice)'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-semibold">{team.points} Wins</span>
                <span className="text-slate-400">{team.totalSpeakerScore.toFixed(1)} Pts</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ADJUDICATORS LIST */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournament.adjudicators.map(judge => (
            <div
              key={judge.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">{judge.name}</h4>
                    <span className="text-xs text-slate-400">{judge.institution}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteJudge(judge.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-950 border border-indigo-500/30 text-indigo-300 rounded">
                    Score: {judge.score.toFixed(1)}
                  </span>
                  {judge.isChair && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-500/30 text-emerald-300 rounded">
                      Chair Accredited
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                    Conflict Clashes
                  </span>
                  {judge.institutionClashes.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {judge.institutionClashes.map((c, i) => (
                        <span
                          key={i}
                          className="text-[11px] text-rose-300 bg-rose-950/40 border border-rose-500/30 px-1.5 py-0.5 rounded"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">No declared conflicts</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
