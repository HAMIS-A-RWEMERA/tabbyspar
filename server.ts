import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

import {
  getOrCreateUser,
  saveTournament,
  getTournamentById,
  publishLiveBallotSlots,
  getLiveBallotsForRound,
  submitLiveBallot,
} from './src/db/tournaments.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini initialization with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Generate AI Opponent Speech
app.post('/api/spar/opponent', async (req, res) => {
  try {
    const { motion, format, side, roundRole, speechHistory } = req.body;

    if (!motion || !side) {
      return res.status(400).json({ error: 'Motion and side are required' });
    }

    const previousSpeechesContext = (speechHistory || [])
      .map((s: { role: string; speaker: string; content: string }) => `[${s.role} - ${s.speaker}]:\n${s.content}`)
      .join('\n\n');

    const prompt = `You are a world-class competitive debater competing as the ${side} (${roundRole}) under ${format || 'WSDC'} rules.
The motion for debate is: "${motion}".

Previous speeches delivered in this round so far:
${previousSpeechesContext ? previousSpeechesContext : 'None yet. You are delivering the opening speech of the round.'}

Instructions:
1. Deliver a rigorous, intellectually formidable competitive debate speech for ${side}.
2. Adhere to official competitive debate structure:
   - Clear roadmap and signposting.
   - If responding to an earlier speech, directly engage with their strongest claims and mechanisms (rebuttal and reframing), explaining why their impacts are mitigated or flipped.
   - Provide 2-3 substantive points with clear characterization, logical mechanisms (step-by-step why it is true), and weighed impacts (magnitude, likelihood, reversibility, vulnerable groups).
   - Use crisp rhetorical debate vocabulary (e.g. "On the burden of proof", "Under our comparative", "Even if we take their highest ground", "Weighing on delta").
3. Keep the speech approximately 500-750 words (suitable for a sharp spar round).
4. Provide a structured response with your speech text, list of key substantive claims, and 2 quick POIs (Points of Information) you would offer if you were listening to the other side.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a champion debate coach and debater (WSDC/WUDC grand finalist). You speak with sharp strategic clarity, logical precision, and authentic debate rhetorical elegance. Never be generic or vague.',
        temperature: 0.7,
      },
    });

    const speechText = response.text || '';

    res.json({
      speechText,
      role: roundRole,
      side,
    });
  } catch (error: any) {
    console.error('Error generating opponent speech:', error);
    res.status(500).json({ error: error.message || 'Failed to generate opponent speech' });
  }
});

// Endpoint: AI Adjudication & RFD (Reason for Decision)
app.post('/api/spar/judge', async (req, res) => {
  try {
    const { motion, format, speeches } = req.body;

    if (!motion || !speeches || !speeches.length) {
      return res.status(400).json({ error: 'Motion and speeches are required for adjudication' });
    }

    const debateTranscript = speeches
      .map((s: { role: string; speaker: string; side: string; content: string }) => `--- [${s.side} | ${s.role} (${s.speaker})] ---\n${s.content}`)
      .join('\n\n');

    const prompt = `You are an experienced Chief Adjudicator (CA) at a World Championship debating tournament (${format || 'WSDC'}).
The motion is: "${motion}".

Transcript of the round:
${debateTranscript}

Evaluate this debate impartially strictly using international competitive debate adjudication standards:
- Treat both sides as having equal initial burden unless established by motion type (policy, value, analysis).
- Never insert your personal political bias or subjective opinion.
- Determine which side proved their comparative world was superior through robust mechanisms and weighing.
- Identify the key clash points that decided the round.
- Score each speaker on standard debate scales:
  * WSDC: Overall 65-78 scale (typical range: 68-75), Content (out of 40), Style (out of 40), Strategy (out of 20).
- Provide constructive, actionable feedback and an insightful Oral Adjudication (Reason for Decision - RFD).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            winner: { type: Type.STRING, description: 'Winning side: "Proposition" or "Opposition" (or "Draw")' },
            decisionMargin: { type: Type.STRING, description: 'Margin of decision (e.g. "Unanimous close decision", "Clear victory on Clash 2")' },
            rfdSummary: { type: Type.STRING, description: 'Comprehensive Oral Adjudication / RFD explaining why the round fell to the winning side.' },
            clashes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Title of the clash (e.g. "Right to Bodily Autonomy vs State Obligation")' },
                  propPosition: { type: Type.STRING, description: 'What Proposition argued' },
                  oppPosition: { type: Type.STRING, description: 'What Opposition responded' },
                  resolution: { type: Type.STRING, description: 'How the judge resolved this clash and which side won it' },
                  winningSide: { type: Type.STRING, description: '"Proposition" or "Opposition"' }
                },
                required: ['title', 'propPosition', 'oppPosition', 'resolution', 'winningSide']
              }
            },
            speakerScores: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING },
                  role: { type: Type.STRING },
                  side: { type: Type.STRING },
                  totalScore: { type: Type.NUMBER, description: 'Standard mark between 65 and 80' },
                  contentScore: { type: Type.NUMBER, description: 'Out of 40' },
                  styleScore: { type: Type.NUMBER, description: 'Out of 40' },
                  strategyScore: { type: Type.NUMBER, description: 'Out of 20' },
                  feedback: { type: Type.STRING, description: 'Constructive tips for improvement' }
                },
                required: ['speaker', 'role', 'side', 'totalScore', 'contentScore', 'styleScore', 'strategyScore', 'feedback']
              }
            },
            coachingTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-4 top strategic takeaways for future rounds'
            }
          },
          required: ['winner', 'decisionMargin', 'rfdSummary', 'clashes', 'speakerScores', 'coachingTips']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error adjudicating debate:', error);
    res.status(500).json({ error: error.message || 'Failed to adjudicate debate' });
  }
});

// Endpoint: AI Speech Text-to-Speech (TTS)
app.post('/api/spar/tts', async (req, res) => {
  try {
    const { text, voiceName } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    // Truncate to reasonable length for TTS if necessary (Gemini TTS limit)
    const textToSpeak = text.length > 2000 ? text.substring(0, 2000) + '...' : text;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: textToSpeak,
              speechMetadata: {
                style: 'Articulate, confident, persuasive competitive debater speaking at a brisk, clear pace.',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Fenrir' }, // Fenrir, Kore, Puck, Zephyr
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio returned from TTS' });
    }

    res.json({ audioBase64: base64Audio });
  } catch (error: any) {
    console.error('Error generating debate TTS:', error);
    res.status(500).json({ error: error.message || 'Failed to generate voice audio' });
  }
});

// Endpoint: AI POI Interactive Response
app.post('/api/spar/poi-response', async (req, res) => {
  try {
    const { motion, currentSpeech, poiQuestion, side } = req.body;

    const prompt = `You are a competitive debater delivering a speech for ${side} on the motion: "${motion}".
The opposing debater just stood up and offered this Point of Information (POI):
"${poiQuestion || 'Could the speaker clarify their mechanism?'}"

Current context of your speech:
"${currentSpeech?.substring(0, 500) || ''}"

Respond to this POI in character as a champion debater:
1. Give a crisp 2-3 sentence rebuttal directly answering and disarming their POI.
2. End with a smooth pivot back to your substantive argument (e.g. "Which is precisely why our comparative holds...").
Keep your response under 70 words so it fits official debate POI time.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a quick-witted, champion competitive debater. Keep your POI answer sharp, decisive, and under 70 words.',
        temperature: 0.7,
      },
    });

    res.json({ poiAnswer: response.text?.trim() || 'We have already accounted for that in our primary mechanism, and our comparative remains superior.' });
  } catch (error: any) {
    console.error('Error generating POI response:', error);
    res.status(500).json({ error: error.message || 'Failed to generate POI response' });
  }
});

// Database: Save/Sync Tournament to Cloud SQL
app.post('/api/tournaments/sync', async (req, res) => {
  try {
    const { tournament, ownerUid } = req.body;
    if (!tournament || !tournament.id) {
      return res.status(400).json({ error: 'Valid tournament object is required' });
    }
    const saved = await saveTournament(tournament, ownerUid || 'anonymous-director');
    res.json({ success: true, tournament: saved });
  } catch (err: any) {
    console.error('Error syncing tournament:', err);
    res.status(500).json({ error: err.message || 'Failed to sync tournament to database' });
  }
});

// Database: Load Tournament from Cloud SQL
app.get('/api/tournaments/:id', async (req, res) => {
  try {
    const tournament = await getTournamentById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    res.json({ success: true, tournament });
  } catch (err: any) {
    console.error('Error retrieving tournament:', err);
    res.status(500).json({ error: err.message || 'Failed to retrieve tournament' });
  }
});

// Database: Publish Round Live Ballot Slots (generates room PINs for judges)
app.post('/api/live-ballots/publish', async (req, res) => {
  try {
    const { tournamentId, roundNumber, pairings, teams, adjudicators } = req.body;
    if (!tournamentId || !roundNumber || !pairings) {
      return res.status(400).json({ error: 'tournamentId, roundNumber, and pairings are required' });
    }
    const published = await publishLiveBallotSlots(
      tournamentId,
      roundNumber,
      pairings,
      teams || [],
      adjudicators || []
    );
    res.json({ success: true, ballots: published });
  } catch (err: any) {
    console.error('Error publishing live ballots:', err);
    res.status(500).json({ error: err.message || 'Failed to publish live ballots' });
  }
});

// Database: Get Live Ballots for Round (for Tab Director dashboard live monitoring)
app.get('/api/live-ballots/:tournamentId/:roundNumber', async (req, res) => {
  try {
    const { tournamentId, roundNumber } = req.params;
    const ballots = await getLiveBallotsForRound(tournamentId, parseInt(roundNumber, 10));
    res.json({ success: true, ballots });
  } catch (err: any) {
    console.error('Error fetching live ballots:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch live ballots' });
  }
});

// Database: Mobile Adjudicator Submit Ballot with Room PIN
app.post('/api/live-ballots/:ballotId/submit', async (req, res) => {
  try {
    const { ballotId } = req.params;
    const { pin, ballotData } = req.body;
    if (!pin || !ballotData) {
      return res.status(400).json({ error: 'PIN and ballotData are required' });
    }
    const result = await submitLiveBallot(ballotId, pin, ballotData);
    res.json({ success: true, result });
  } catch (err: any) {
    console.error('Error submitting mobile ballot:', err);
    res.status(400).json({ error: err.message || 'Failed to submit ballot' });
  }
});

// Mount Vite or serve static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
      console.log(`Debate Server running on http://localhost:${PORT}`);
    });
  }
}

if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
