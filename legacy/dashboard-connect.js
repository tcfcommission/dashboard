// ============================================================
// DASHBOARD CONNECT  —  wire your existing dashboard to the backend
// ============================================================
// Your current dashboard (personal-command.html) works standalone with
// localStorage. To make it pull LIVE data from your backend instead,
// paste this into the dashboard's <script>, then call fetchLiveData()
// right after unlock (inside tryUnlock, after renderAll()).
//
// It fetches from your deployed backend and drops the data straight
// into the existing DATA object — every render function keeps working
// exactly as-is. Manual editing still works as a fallback.
// ============================================================

// 1. Set these two after you deploy the backend:
const BACKEND_URL = 'https://YOUR-BACKEND.vercel.app';  // your Vercel URL
const DASHBOARD_TOKEN = 'YOUR-LONG-RANDOM-TOKEN';        // must match Vercel env var

// 2. Fetch live data and merge into DATA
async function fetchLiveData() {
  if (!BACKEND_URL.includes('vercel.app')) return; // not configured yet — stay on manual/localStorage
  try {
    const r = await fetch(BACKEND_URL + '/api/get-dashboard', {
      headers: { Authorization: 'Bearer ' + DASHBOARD_TOKEN }
    });
    const live = await r.json();
    if (!live.ok) throw new Error(live.error || 'backend error');

    // Merge live values into the existing DATA shape
    DATA.name = live.name || DATA.name;
    if (live.socials?.length) {
      DATA.socials = live.socials.map(s => ({
        id: s.id, platform: s.platform, handle: s.handle,
        followers: s.followers, views: s.views, growth: s.growth,
        source: s.source
      }));
    }
    if (live.businesses?.length) {
      DATA.businesses = live.businesses.map(b => ({
        id: b.id, name: b.name, emoji: b.emoji,
        revenue: b.revenue, sales: b.sales, source: b.source
      }));
    }
    if (live.goals?.length) {
      DATA.goals = live.goals.map(g => ({
        id: g.id, name: g.name, current: g.current, target: g.target
      }));
    }
    if (live.tasks) DATA.tasks = live.tasks;
    if (live.revHistory?.length) DATA.revHistory = live.revHistory;

    saveData();   // cache it locally too
    renderAll();  // repaint with live numbers
    console.log('Live data loaded from backend ✓');
  } catch (e) {
    console.warn('Backend not reachable, using local data:', e.message);
    // dashboard keeps working with whatever is in localStorage
  }
}

// 3. Optional: a manual refresh button that forces the backend to re-sync
async function triggerRefresh() {
  try {
    await fetch(BACKEND_URL + '/api/refresh-all', { method: 'POST' });
    setTimeout(fetchLiveData, 3000); // give it a few seconds, then re-pull
  } catch (e) { console.warn('Refresh failed:', e.message); }
}

// ---- HOW TO ACTIVATE ----
// In tryUnlock(), after the line `renderAll();`, add:  fetchLiveData();
