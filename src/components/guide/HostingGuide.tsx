import React from 'react';
import { Cloud, CheckCircle, XCircle, ShieldCheck, Zap, Server, DollarSign, Terminal, ArrowRight } from 'lucide-react';

export const HostingGuide: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8">
        <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 block mb-2">
          Architectural Blueprint & Reality Check
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
          The Honest Truth: Free Deployment, Tabbycat Limitations & Scale
        </h2>
        <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-3xl">
          As a debate coach and judge, your instinct is 100% correct: traditional Tabbycat is technically open-source, but it is <strong className="text-white">not free in practice</strong>. Here is the honest technical explanation of why, and how modern serverless and client-first architecture allows you to host an alternative completely free forever.
        </p>
      </div>

      {/* Why Tabbycat Costs Money vs Why This Is Free */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-rose-900/40 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-rose-400">
            <XCircle className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Why Tabbycat Costs Money</h3>
          </div>
          <ul className="text-xs text-slate-300 space-y-3 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span>
                <strong className="text-white">Heavy Python/Django Monolith:</strong> Tabbycat requires a persistent web server process (Gunicorn) that must stay awake 24/7.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span>
                <strong className="text-white">Mandatory PostgreSQL & Redis:</strong> Tabbycat cannot run without an external relational database and Redis for background Celery tasks. Ever since Heroku cancelled its free tier, hosting Postgres + Redis costs at least $10-$20/month.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span>
                <strong className="text-white">Ballot Submission Bottlenecks:</strong> When 80 adjudicators enter ballots simultaneously after Round 3, a cheap server crashes from database connection exhaustion.
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Why TabbySpar Stays 100% Free</h3>
          </div>
          <ul className="text-xs text-slate-300 space-y-3 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span>
                <strong className="text-white">Client-First Compute:</strong> The Swiss power-pairing algorithm, ballot verification, and speaker rankings execute instantly on the user’s device (browser JavaScript). There is zero server CPU usage for tabulation.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span>
                <strong className="text-white">Static Web Hosting:</strong> The frontend is pure static assets (HTML/JS/CSS). Platforms like Microsoft Azure and Vercel host static sites with global CDN distribution for $0.00.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span>
                <strong className="text-white">On-Demand Serverless AI:</strong> The AI Debate Spar Zone and Adjudicator run on-demand serverless endpoints via Google Gemini, which scale down to zero when idle.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Comparison Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Platform Comparison Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Feature</th>
                <th className="py-3 px-4">Standard Tabbycat</th>
                <th className="py-3 px-4">Calicotab Service</th>
                <th className="py-3 px-4 text-indigo-400">TabbySpar (This App)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Hosting Cost</td>
                <td className="py-3 px-4 text-slate-400">$7 - $15 / month (Postgres + Dyno)</td>
                <td className="py-3 px-4 text-slate-400">$10 - $25 / tournament</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">$0.00 (Free Forever)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Setup Complexity</td>
                <td className="py-3 px-4 text-slate-400">High (CLI, Git, Docker, Postgres)</td>
                <td className="py-3 px-4 text-slate-400">Low (Managed portal)</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Zero (Open link in browser)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Swiss Power Pairing</td>
                <td className="py-3 px-4 text-emerald-400">Yes (WSDC / BP / AP)</td>
                <td className="py-3 px-4 text-emerald-400">Yes</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Yes (Instant client-side)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Simultaneous Users</td>
                <td className="py-3 px-4 text-slate-400">Limited by DB connection pool</td>
                <td className="py-3 px-4 text-slate-400">Depends on plan tier</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Unlimited (Distributed CDN)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">AI Sparring & Judge</td>
                <td className="py-3 px-4 text-rose-400">None</td>
                <td className="py-3 px-4 text-rose-400">None</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Built-in (WSDC & BP Rubrics)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Offline Tournament Mode</td>
                <td className="py-3 px-4 text-rose-400">Requires local Docker setup</td>
                <td className="py-3 px-4 text-rose-400">No (Cloud only)</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Yes (LocalStorage / JSON export)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Step-by-Step Free Microsoft Azure Deployment Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white">
            Step-by-Step Guide: Deploying to Microsoft Azure (100% Free)
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Microsoft Azure offers <strong className="text-white">Azure Static Web Apps (Free Plan)</strong>. It provides 100 GB of free bandwidth every month, custom domain with SSL certificate, and automated GitHub Actions deployment.
        </p>

        <div className="space-y-4 font-mono text-xs">
          {/* Step 1 */}
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <span className="text-indigo-400 font-bold">Step 1: Push Code to GitHub</span>
            <p className="text-slate-300 font-sans">
              Create a free GitHub repository and push your application code to the repository.
            </p>
            <div className="bg-slate-900 p-2.5 rounded text-slate-300 overflow-x-auto">
              git init && git add . && git commit -m "Deploy TabbySpar" && git push origin main
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <span className="text-indigo-400 font-bold">Step 2: Create Azure Static Web App</span>
            <p className="text-slate-300 font-sans">
              Log into <a href="https://portal.azure.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Azure Portal</a> (free account), search for <strong>Static Web Apps</strong>, and click <strong>Create</strong>:
            </p>
            <ul className="text-slate-400 font-sans list-disc list-inside space-y-1">
              <li>Plan type: Select <strong className="text-white">Free</strong>.</li>
              <li>Deployment details: Choose <strong className="text-white">GitHub</strong> and select your repository.</li>
              <li>Build Presets: Select <strong className="text-white">Custom</strong>.</li>
              <li>App location: <code className="text-indigo-300">/</code></li>
              <li>Output location: <code className="text-indigo-300">dist</code></li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <span className="text-indigo-400 font-bold">Step 3: Add Gemini API Key</span>
            <p className="text-slate-300 font-sans">
              In Azure Portal, open your Static Web App, click <strong>Configuration</strong> &gt; <strong>Application settings</strong>, and add:
            </p>
            <div className="bg-slate-900 p-2.5 rounded text-slate-300 overflow-x-auto">
              GEMINI_API_KEY = your_gemini_api_key_from_google_ai_studio
            </div>
          </div>
        </div>

        {/* Note on Vercel */}
        <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-lg text-xs text-slate-300 space-y-1.5 leading-relaxed">
          <strong className="text-white block font-semibold">
            Clarification on Vercel:
          </strong>
          You mentioned thinking Vercel won't work well. In reality, Vercel also works seamlessly for this exact architecture! You can deploy this exact repository to Vercel with 1 click; the static frontend compiles via Vite, and server routes run as Vercel Serverless Functions on the free tier.
        </div>
      </div>
    </div>
  );
};
