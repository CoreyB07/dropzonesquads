import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';

const fmtErr = (err) => ({
  code: err?.code || 'no-code',
  message: err?.message || 'unknown error',
  details: err?.details || null,
  hint: err?.hint || null
});

const withTimeout = async (promise, label, ms = 12000) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`${label} timed out after ${ms}ms`);
      err.code = 'TIMEOUT';
      reject(err);
    }, ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
};

const buildMarkdownReport = (results) => {
  const lines = [
    '# DropZoneSquads Diagnostics Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `User Agent: ${navigator.userAgent}`,
    ''
  ];

  results.forEach((r) => {
    lines.push(`## ${r.step} - ${r.ok ? 'PASS' : 'FAIL'}`);
    if (r.data) {
      lines.push('```json');
      lines.push(JSON.stringify(r.data, null, 2));
      lines.push('```');
    }
    if (r.error) {
      lines.push('```json');
      lines.push(JSON.stringify(r.error, null, 2));
      lines.push('```');
    }
    lines.push('');
  });

  return lines.join('\n');
};

const Diagnostics = () => {
  const { user, isSupabaseReady } = useAuth();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [copyStatus, setCopyStatus] = useState('');

  const status = useMemo(() => {
    const passCount = results.filter((r) => r.ok).length;
    return `${passCount}/${results.length} checks passing`;
  }, [results]);

  const push = (arr, item) => [...arr, item];

  const runChecks = async () => {
    setRunning(true);
    let out = [];

    out = push(out, { step: 'ENV_S1', ok: Boolean(isSupabaseReady && supabase), data: { isSupabaseReady: Boolean(isSupabaseReady), hasSupabase: Boolean(supabase) } });

    if (!supabase) {
      setResults(out);
      setRunning(false);
      return;
    }

    // Network sanity check against Supabase REST endpoint.
    // 401 here is expected without auth headers and means endpoint is reachable.
    try {
      const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://imdkaqhnnmgzgiykmxnz.supabase.co').trim();
      const netResponse = await withTimeout(fetch(`${supabaseUrl}/rest/v1/`, { method: 'GET' }), 'NET_S1 supabase rest probe', 12000);
      const status = netResponse?.status || null;
      const reachableUnauthExpected = status === 401;
      out = push(out, {
        step: 'NET_S1',
        ok: Boolean(netResponse) && (reachableUnauthExpected || Boolean(netResponse?.ok)),
        data: {
          status,
          ok: Boolean(netResponse?.ok),
          reachable_unauth_expected: reachableUnauthExpected
        }
      });
    } catch (e) {
      out = push(out, { step: 'NET_S1', ok: false, error: fmtErr(e) });
    }

    // AUTH checks use app context only to avoid browser-specific Supabase auth hangs/side effects.
    out = push(out, {
      step: 'AUTH_S1',
      ok: Boolean(user?.id),
      data: {
        hasContextUser: Boolean(user?.id),
        contextUserId: user?.id || null,
        contextEmail: user?.email || null
      }
    });

    out = push(out, {
      step: 'AUTH_S2',
      ok: Boolean(user?.onboardingComplete),
      data: {
        onboardingComplete: Boolean(user?.onboardingComplete),
        username: user?.username || null,
        platform: user?.platform || null
      }
    });

    const uid = user?.id;
    if (!uid) {
      out = push(out, { step: 'AUTH_S3', ok: false, error: { code: 'NO_UID', message: 'No signed-in context user available for DB checks' } });
      setResults(out);
      setRunning(false);
      return;
    }

    // NET_S2: authenticated lightweight ping using the same Supabase client/key
    // to separate key/auth failures from heavier query latency.
    try {
      const { count, error: authPingErr } = await withTimeout(
        supabase.from('profiles').select('id', { head: true, count: 'exact' }).eq('id', uid),
        'NET_S2 authenticated head ping',
        5000
      );
      if (authPingErr) out = push(out, { step: 'NET_S2', ok: false, error: fmtErr(authPingErr) });
      else out = push(out, { step: 'NET_S2', ok: true, data: { authenticatedPing: true, count: typeof count === 'number' ? count : null } });
    } catch (e) {
      out = push(out, { step: 'NET_S2', ok: false, error: fmtErr(e) });
    }

    // PROFILE_S1
    try {
      const { data: profileRows, error: profileErr } = await withTimeout(
        supabase.from('profiles').select('id, email, username, platform').eq('id', uid).limit(1),
        'PROFILE_S1 profiles lookup'
      );
      if (profileErr) out = push(out, { step: 'PROFILE_S1', ok: false, error: fmtErr(profileErr) });
      else out = push(out, { step: 'PROFILE_S1', ok: true, data: { rows: profileRows?.length || 0, profile: profileRows?.[0] || null } });
    } catch (e) {
      out = push(out, { step: 'PROFILE_S1', ok: false, error: fmtErr(e) });
    }

    // INBOX_S1
    let partRows = [];
    try {
      const { data, error } = await withTimeout(
        supabase.from('conversation_participants').select('conversation_id').eq('user_id', uid).limit(50),
        'INBOX_S1 participants lookup'
      );
      if (error) out = push(out, { step: 'INBOX_S1', ok: false, error: fmtErr(error) });
      else {
        partRows = data || [];
        out = push(out, { step: 'INBOX_S1', ok: true, data: { participantRows: partRows.length } });
      }
    } catch (e) {
      out = push(out, { step: 'INBOX_S1', ok: false, error: fmtErr(e) });
    }

    const convIds = partRows.map((r) => r.conversation_id);
    if (convIds.length > 0) {
      try {
        const { data: messagesRows, error: msgErr } = await withTimeout(
          supabase.from('messages').select('conversation_id, created_at, sender_id').in('conversation_id', convIds).limit(100),
          'INBOX_S2 messages lookup'
        );
        if (msgErr) out = push(out, { step: 'INBOX_S2', ok: false, error: fmtErr(msgErr) });
        else out = push(out, { step: 'INBOX_S2', ok: true, data: { messageRows: messagesRows?.length || 0 } });
      } catch (e) {
        out = push(out, { step: 'INBOX_S2', ok: false, error: fmtErr(e) });
      }
    } else {
      out = push(out, { step: 'INBOX_S2', ok: true, data: { skipped: true, reason: 'No conversations yet' } });
    }

    try {
      const { data: notifRows, error: notifErr } = await withTimeout(
        supabase.from('notifications').select('id, recipient_id, actor_id, type, created_at, read_at').eq('recipient_id', uid).limit(25),
        'INBOX_S3 notifications lookup'
      );
      if (notifErr) out = push(out, { step: 'INBOX_S3', ok: false, error: fmtErr(notifErr) });
      else out = push(out, { step: 'INBOX_S3', ok: true, data: { notifications: notifRows?.length || 0 } });
    } catch (e) {
      out = push(out, { step: 'INBOX_S3', ok: false, error: fmtErr(e) });
    }

    try {
      const { error: squadSelectErr } = await withTimeout(
        supabase.from('squads').select('id, creator_id').eq('creator_id', uid).limit(1),
        'SQUAD_S1 squads read preflight'
      );
      if (squadSelectErr) out = push(out, { step: 'SQUAD_S1', ok: false, error: fmtErr(squadSelectErr) });
      else out = push(out, { step: 'SQUAD_S1', ok: true, data: { note: 'squads table readable for user context' } });
    } catch (e) {
      out = push(out, { step: 'SQUAD_S1', ok: false, error: fmtErr(e) });
    }

    setResults(out);
    setRunning(false);
  };

  const handleCopyMarkdown = async () => {
    const report = buildMarkdownReport(results);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(report);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      setCopyStatus('Copied');
    } catch (e) {
      // Fallback for browsers/contexts where Clipboard API is blocked.
      try {
        const textArea = document.createElement('textarea');
        textArea.value = report;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopyStatus(ok ? 'Copied' : 'Copy failed');
      } catch (fallbackErr) {
        console.warn('Clipboard write failed:', e, fallbackErr);
        setCopyStatus('Copy failed');
      }
    }

    setTimeout(() => setCopyStatus(''), 2000);
  };

  const handleDownloadMarkdown = () => {
    const report = buildMarkdownReport(results);
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dropzonesquads-diag-${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="card-tactical space-y-4">
        <h1 className="text-2xl font-black uppercase tracking-widest text-white">Diagnostics</h1>
        <p className="text-sm text-gray-400">Runs deterministic auth + inbox + squad preflight checks and prints exact errors.</p>
        <p className="text-xs text-gray-500">Note: On GitHub Pages SPA routing, opening <code>/diag</code> directly may log a console 404 before fallback routing loads the app. NET_S1 status 401 is expected for unauthenticated REST reachability.</p>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={runChecks} disabled={running} className="btn-tactical">
            {running ? 'Running Checks...' : 'Run Checks'}
          </button>
          <button
            onClick={handleCopyMarkdown}
            disabled={results.length === 0}
            className="px-4 py-2 rounded-lg border border-military-gray bg-charcoal-dark text-xs font-black uppercase tracking-widest text-gray-300 disabled:opacity-40"
          >
            {copyStatus || 'Copy Report (.md)'}
          </button>
          <button
            onClick={handleDownloadMarkdown}
            disabled={results.length === 0}
            className="px-4 py-2 rounded-lg border border-military-gray bg-charcoal-dark text-xs font-black uppercase tracking-widest text-gray-300 disabled:opacity-40"
          >
            Download Report (.md)
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-gray-400">{status}</span>
        </div>
      </div>

      <div className="space-y-3">
        {results.map((r, i) => (
          <div key={`${r.step}-${i}`} className={`rounded-xl border p-4 ${r.ok ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-widest text-white">{r.step}</p>
              <span className={`text-[10px] font-black uppercase tracking-widest ${r.ok ? 'text-green-300' : 'text-red-300'}`}>{r.ok ? 'PASS' : 'FAIL'}</span>
            </div>
            {r.data && <pre className="mt-2 text-xs text-gray-300 whitespace-pre-wrap">{JSON.stringify(r.data, null, 2)}</pre>}
            {r.error && <pre className="mt-2 text-xs text-red-200 whitespace-pre-wrap">{JSON.stringify(r.error, null, 2)}</pre>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Diagnostics;
