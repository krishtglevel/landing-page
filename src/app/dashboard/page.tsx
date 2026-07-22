'use client';

import { useEffect, useState, useRef } from 'react';

/* ─── Types ─── */
type Submission = {
  index: number;
  fullName: string;
  phone: string;
  timestamp: string;
  platform: string;
  campaign: string;
  utmSource: string;
  landingPage: string;
};

type OverviewData = {
  totalLeads: number;
  platforms: Record<string, number>;
  topCampaign: { name: string; leads: number } | null;
  topLandingPage: { path: string; leads: number } | null;
};

type PlatformData = { platform: string; leads: number; percentage: number };
type CampaignData = { campaign: string; platform: string; leads: number };
type AdData = { ad: string; campaign: string; platform: string; leads: number };
type LandingPageData = { path: string; leads: number };
type ChatMessage = { role: 'user' | 'assistant'; text: string };

/* ─── Constants ─── */
const PLATFORM_COLORS: Record<string, string> = {
  Google: '#10b981',
  Meta: '#1877f2',
  YouTube: '#ff0000',
  Direct: '#64748b',
  Other: '#64748b',
};

const RANGE_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'All Time', value: 'all' },
];

/* ─── Main Component ─── */
export default function Dashboard() {
  const [data, setData] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [newCount, setNewCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const prevLengthRef = useRef(0);

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [platforms, setPlatforms] = useState<PlatformData[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [ads, setAds] = useState<AdData[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPageData[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [range, setRange] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [lpFilter, setLpFilter] = useState('all');

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: "Hi! Ask me anything about your marketing data.",
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<
    'platforms' | 'campaigns' | 'ads' | 'landingPages' | 'leads'
  >('platforms');

  /* ── Live stream ── */
  useEffect(() => {
    const es = new EventSource('/api/submissions/stream');
    es.onopen = () => setConnected(true);
    es.onmessage = (event) => {
      const json: Submission[] = JSON.parse(event.data);
      setData(json);
      setLoading(false);
      setConnected(true);
      setLastUpdated(
        new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      );
      if (prevLengthRef.current > 0 && json.length > prevLengthRef.current) {
        const diff = json.length - prevLengthRef.current;
        setNewCount(diff);
        setTimeout(() => setNewCount(0), 3500);
      }
      prevLengthRef.current = json.length;
    };
    es.onerror = () => setConnected(false);
    return () => es.close();
  }, []);

  /* ── Fetch analytics ── */
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const params = `?range=${range}`;
      const [ovRes, plRes, caRes, adRes, lpRes] = await Promise.all([
        fetch(`/api/analytics/overview${params}`),
        fetch(`/api/analytics/platforms${params}`),
        fetch(`/api/analytics/campaigns${params}`),
        fetch(`/api/analytics/ads${params}`),
        fetch(`/api/analytics/landing-pages${params}`),
      ]);
      if (ovRes.ok) setOverview(await ovRes.json());
      if (plRes.ok) setPlatforms(await plRes.json());
      if (caRes.ok) setCampaigns(await caRes.json());
      if (adRes.ok) setAds(await adRes.json());
      if (lpRes.ok) setLandingPages(await lpRes.json());
    } catch (err) {
      console.error('Analytics fetch error:', err);
    }
    setAnalyticsLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  useEffect(() => {
    if (data.length > 0 && !loading) {
      fetchAnalytics();
    }
  }, [data.length]);

  /* ── Chat ── */
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const question = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: question }]);
    setChatLoading(true);
    try {
      const res = await fetch('/api/analytics/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer || data.error || 'Something went wrong.',
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Network error. Please try again.' },
      ]);
    }
    setChatLoading(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  /* ── Filters ── */
  const filteredCampaigns = campaigns.filter((c) => {
    if (platformFilter !== 'all' && c.platform !== platformFilter) return false;
    return true;
  });

  const filteredAds = ads.filter((a) => {
    if (platformFilter !== 'all' && a.platform !== platformFilter) return false;
    if (campaignFilter !== 'all' && a.campaign !== campaignFilter) return false;
    return true;
  });

  const filteredLeads = data.filter((s) => {
    if (platformFilter !== 'all' && s.platform !== platformFilter) return false;
    if (campaignFilter !== 'all' && s.campaign !== campaignFilter) return false;
    if (lpFilter !== 'all' && s.landingPage !== lpFilter) return false;
    return true;
  });

  const uniquePlatforms = [...new Set(data.map((d) => d.platform))].filter(Boolean);
  const uniqueCampaigns = [...new Set(data.map((d) => d.campaign))].filter(Boolean);
  const uniqueLPs = [...new Set(data.map((d) => d.landingPage))].filter(Boolean);

  const handleDownload = () => {
    window.location.href = '/api/export';
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.brand}>
              <div style={s.brandLogo}>TG</div>
              <div>
                <h1 style={s.brandTitle}>Marketing Intelligence</h1>
                <p style={s.brandSub}>Track performance and lead journey</p>
              </div>
            </div>
          </div>
          <div style={s.headerActions}>
            {lastUpdated && (
              <span style={s.lastUpdate}>Updated {lastUpdated}</span>
            )}
            <div style={connected ? s.statusLive : s.statusOff}>
              <span style={s.statusDot} />
              {connected ? 'Live' : 'Reconnecting'}
            </div>
            <button onClick={handleDownload} style={s.btnExport}>
              ↓ Export Excel
            </button>
          </div>
        </div>

        {/* New lead notification */}
        {newCount > 0 && (
          <div style={s.newLeadBanner}>
            🎉 +{newCount} new lead{newCount > 1 ? 's' : ''} received
          </div>
        )}

        {/* Filters */}
        <div style={s.filters}>
          <div style={s.filterItem}>
            <label style={s.filterLabel}>Date Range</label>
            <select style={s.filterSelect} value={range} onChange={(e) => setRange(e.target.value)}>
              {RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div style={s.filterItem}>
            <label style={s.filterLabel}>Platform</label>
            <select style={s.filterSelect} value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
              <option value="all">All Platforms</option>
              {uniquePlatforms.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div style={s.filterItem}>
            <label style={s.filterLabel}>Campaign</label>
            <select style={s.filterSelect} value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)}>
              <option value="all">All Campaigns</option>
              {uniqueCampaigns.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div style={s.filterItem}>
            <label style={s.filterLabel}>Landing Page</label>
            <select style={s.filterSelect} value={lpFilter} onChange={(e) => setLpFilter(e.target.value)}>
              <option value="all">All Pages</option>
              {uniqueLPs.map((lp) => (
                <option key={lp} value={lp}>{lp}</option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={s.kpiGrid}>
          <div style={s.kpiCard}>
            <div style={s.kpiLabel}>Total Leads</div>
            <div style={s.kpiValue}>{analyticsLoading ? '—' : (overview?.totalLeads ?? 0).toLocaleString()}</div>
          </div>
          <div style={s.kpiCard}>
            <div style={s.kpiLabel}>Google</div>
            <div style={s.kpiValue}>{analyticsLoading ? '—' : (overview?.platforms?.Google ?? 0).toLocaleString()}</div>
          </div>
          <div style={s.kpiCard}>
            <div style={s.kpiLabel}>Meta</div>
            <div style={s.kpiValue}>{analyticsLoading ? '—' : (overview?.platforms?.Meta ?? 0).toLocaleString()}</div>
          </div>
          <div style={s.kpiCard}>
            <div style={s.kpiLabel}>YouTube</div>
            <div style={s.kpiValue}>{analyticsLoading ? '—' : (overview?.platforms?.YouTube ?? 0).toLocaleString()}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {[
            { key: 'platforms', label: 'Platforms' },
            { key: 'campaigns', label: 'Campaigns' },
            { key: 'ads', label: 'Ads' },
            { key: 'landingPages', label: 'Pages' },
            { key: 'leads', label: 'Leads' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={activeTab === tab.key ? s.tabActive : s.tab}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={s.content}>
          {activeTab === 'platforms' && (
            <>
              <h2 style={s.contentTitle}>Platform Performance</h2>
              {platforms.length === 0 ? (
                <p style={s.empty}>No data yet</p>
              ) : (
                <div style={s.platformsGrid}>
                  {platforms.map((p) => (
                    <div key={p.platform} style={s.platformCard}>
                      <div style={s.platformTop}>
                        <span style={{ ...s.platformDot, background: PLATFORM_COLORS[p.platform] }} />
                        <span style={s.platformName}>{p.platform}</span>
                      </div>
                      <div style={s.platformValue}>{p.leads.toLocaleString()}</div>
                      <div style={s.platformBar}>
                        <div style={{ ...s.platformBarFill, width: `${p.percentage}%`, background: PLATFORM_COLORS[p.platform] }} />
                      </div>
                      <div style={s.platformPct}>{p.percentage.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'campaigns' && (
            <>
              <h2 style={s.contentTitle}>Campaign Performance</h2>
              {filteredCampaigns.length === 0 ? (
                <p style={s.empty}>No campaigns yet</p>
              ) : (
                <div style={s.tableWrap}>
                  <table style={s.table} className="dash-table">
                    <thead>
                      <tr>
                        <th style={s.th}>#</th>
                        <th style={s.th}>Campaign</th>
                        <th style={s.th}>Platform</th>
                        <th style={s.th}>Leads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCampaigns.map((c, i) => (
                        <tr key={c.campaign}>
                          <td style={s.td}>{i + 1}</td>
                          <td style={s.tdBold}>{c.campaign}</td>
                          <td style={s.td}>
                            <span style={{ ...s.badge, background: PLATFORM_COLORS[c.platform] }}>
                              {c.platform}
                            </span>
                          </td>
                          <td style={s.tdNum}>{c.leads.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'ads' && (
            <>
              <h2 style={s.contentTitle}>Ad Performance</h2>
              {filteredAds.length === 0 ? (
                <p style={s.empty}>No ads yet</p>
              ) : (
                <div style={s.tableWrap}>
                  <table style={s.table} className="dash-table">
                    <thead>
                      <tr>
                        <th style={s.th}>#</th>
                        <th style={s.th}>Ad</th>
                        <th style={s.th}>Campaign</th>
                        <th style={s.th}>Platform</th>
                        <th style={s.th}>Leads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAds.map((a, i) => (
                        <tr key={a.ad}>
                          <td style={s.td}>{i + 1}</td>
                          <td style={s.tdBold}>{a.ad}</td>
                          <td style={s.td}>{a.campaign}</td>
                          <td style={s.td}>
                            <span style={{ ...s.badge, background: PLATFORM_COLORS[a.platform] }}>
                              {a.platform}
                            </span>
                          </td>
                          <td style={s.tdNum}>{a.leads.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'landingPages' && (
            <>
              <h2 style={s.contentTitle}>Landing Page Performance</h2>
              {landingPages.length === 0 ? (
                <p style={s.empty}>No pages yet</p>
              ) : (
                <div style={s.tableWrap}>
                  <table style={s.table} className="dash-table">
                    <thead>
                      <tr>
                        <th style={s.th}>#</th>
                        <th style={s.th}>Page</th>
                        <th style={s.th}>Leads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {landingPages.map((lp, i) => (
                        <tr key={lp.path}>
                          <td style={s.td}>{i + 1}</td>
                          <td style={s.tdCode}><code style={s.code}>{lp.path}</code></td>
                          <td style={s.tdNum}>{lp.leads.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'leads' && (
            <>
              <h2 style={s.contentTitle}>Lead Details ({filteredLeads.length})</h2>
              {loading ? (
                <p style={s.empty}>Connecting...</p>
              ) : filteredLeads.length === 0 ? (
                <p style={s.empty}>No leads yet</p>
              ) : (
                <>
                  <div style={s.tableWrap}>
                    <table style={s.table} className="dash-table">
                      <thead>
                        <tr>
                          <th style={s.th}>#</th>
                          <th style={s.th}>Name</th>
                          <th style={s.th}>Phone</th>
                          <th style={s.th}>Platform</th>
                          <th style={s.th}>Campaign</th>
                          <th style={s.th}>Page</th>
                          <th style={s.th}>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map((row) => (
                          <tr key={row.index}>
                            <td style={s.td}>{row.index}</td>
                            <td style={s.tdBold}>{row.fullName}</td>
                            <td style={s.td}>{row.phone}</td>
                            <td style={s.td}>
                              <span style={{ ...s.badge, background: PLATFORM_COLORS[row.platform] }}>
                                {row.platform}
                              </span>
                            </td>
                            <td style={s.td}>{row.campaign || '—'}</td>
                            <td style={s.tdCode}><code style={s.code}>{row.landingPage || '/'}</code></td>
                            <td style={s.tdMuted}>{row.timestamp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="dash-cards">
                    {filteredLeads.map((row) => (
                      <div key={row.index} style={s.mobileCard}>
                        <div style={s.mobileTop}>
                          <span style={s.mobileIndex}>#{row.index}</span>
                          <span style={{ ...s.badge, background: PLATFORM_COLORS[row.platform] }}>
                            {row.platform}
                          </span>
                        </div>
                        <p style={s.mobileName}>{row.fullName}</p>
                        <p style={s.mobilePhone}>{row.phone}</p>
                        {row.campaign && <p style={s.mobileMeta}>Campaign: {row.campaign}</p>}
                        <p style={s.mobileTime}>{row.timestamp}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {!loading && data.length > 0 && (
          <div style={s.footer}>
            Total: <strong>{data.length.toLocaleString()}</strong> submissions
          </div>
        )}
      </div>

      {/* Chat FAB */}
      <button onClick={() => setChatOpen(!chatOpen)} style={s.chatFab}>
        {chatOpen ? '✕' : '💬'}
      </button>

      {/* Chat Panel */}
      {chatOpen && (
        <div style={s.chatPanel}>
          <div style={s.chatHeader}>
            <span>🤖 Marketing Assistant</span>
          </div>

          <div style={s.chatBody}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={msg.role === 'user' ? s.msgUser : s.msgBot}>
                <div style={msg.role === 'user' ? s.bubbleUser : s.bubbleBot}>
                  {msg.text.split('\n').map((line, j) => (
                    <span key={j}>
                      {line.replace(/\*\*(.*?)\*\*/g, '«$1»').split('«').map((part, k) => {
                        if (part.includes('»')) {
                          const [bold, rest] = part.split('»');
                          return <span key={k}><strong>{bold}</strong>{rest}</span>;
                        }
                        return <span key={k}>{part}</span>;
                      })}
                      <br />
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={s.msgBot}>
                <div style={s.bubbleBot}>Thinking...</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={s.chatQuick}>
            {['Which platform has the most leads?', 'Top campaign?', 'Compare Google and Meta'].map((q) => (
              <button key={q} style={s.quickBtn} onClick={() => setChatInput(q)}>
                {q}
              </button>
            ))}
          </div>

          <div style={s.chatInput}>
            <input
              style={s.input}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder="Ask about your data..."
              disabled={chatLoading}
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              style={s.btnSend}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        .dash-table { display: table; }
        .dash-cards { display: none; }
        
        @media (max-width: 768px) {
          .dash-table { display: none !important; }
          .dash-cards { display: flex; flex-direction: column; gap: 12px; }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════
   CLEAN PROFESSIONAL STYLES
   ═══════════════════════════════════════ */
const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f8faf9',
    minHeight: '100vh',
    padding: '24px 16px',
  },
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  brandLogo: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: '#10b981',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 700,
  },
  brandTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#0f172a',
  },
  brandSub: {
    margin: '2px 0 0',
    fontSize: '14px',
    color: '#64748b',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  lastUpdate: {
    fontSize: '13px',
    color: '#64748b',
  },
  statusLive: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    background: '#d1fae5',
    color: '#065f46',
    fontSize: '13px',
    fontWeight: 600,
  },
  statusOff: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    background: '#fef3c7',
    color: '#92400e',
    fontSize: '13px',
    fontWeight: 600,
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'currentColor',
  },
  btnExport: {
    background: '#10b981',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  // New lead banner
  newLeadBanner: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: 600,
    textAlign: 'center',
  },

  // Filters
  filters: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
    padding: '20px',
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  filterItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  filterSelect: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    color: '#0f172a',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
  },

  // KPI Cards
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  kpiCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  kpiLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748b',
    marginBottom: '8px',
  },
  kpiValue: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#0f172a',
  },

  // Tabs
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '0',
    overflowX: 'auto',
    background: '#fff',
    padding: '4px',
    borderRadius: '8px 8px 0 0',
    border: '1px solid #e2e8f0',
    borderBottom: 'none',
  },
  tab: {
    padding: '10px 20px',
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    padding: '10px 20px',
    border: 'none',
    background: '#f1f5f9',
    color: '#10b981',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
  },

  // Content
  content: {
    background: '#fff',
    padding: '24px',
    borderRadius: '0 0 12px 12px',
    border: '1px solid #e2e8f0',
    minHeight: '400px',
  },
  contentTitle: {
    margin: '0 0 20px',
    fontSize: '20px',
    fontWeight: 700,
    color: '#0f172a',
  },
  empty: {
    color: '#94a3b8',
    fontSize: '14px',
    textAlign: 'center',
    padding: '60px 20px',
  },

  // Platforms
  platformsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  platformCard: {
    background: '#f8fafc',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  platformTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  platformDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  platformName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0f172a',
  },
  platformValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '12px',
  },
  platformBar: {
    height: '6px',
    background: '#e2e8f0',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  platformBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  },
  platformPct: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748b',
  },

  // Table
  tableWrap: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#334155',
    borderBottom: '1px solid #f1f5f9',
  },
  tdBold: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#0f172a',
    fontWeight: 600,
    borderBottom: '1px solid #f1f5f9',
  },
  tdNum: {
    padding: '12px 16px',
    fontSize: '15px',
    color: '#0f172a',
    fontWeight: 700,
    borderBottom: '1px solid #f1f5f9',
  },
  tdMuted: {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#94a3b8',
    borderBottom: '1px solid #f1f5f9',
  },
  tdCode: {
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9',
  },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
  },
  code: {
    background: '#f1f5f9',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'monospace',
    color: '#475569',
  },

  // Mobile cards
  mobileCard: {
    background: '#fff',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  mobileTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  mobileIndex: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#94a3b8',
  },
  mobileName: {
    margin: '0 0 4px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#0f172a',
  },
  mobilePhone: {
    margin: '0 0 8px',
    fontSize: '14px',
    color: '#475569',
  },
  mobileMeta: {
    margin: '0 0 4px',
    fontSize: '13px',
    color: '#64748b',
  },
  mobileTime: {
    margin: 0,
    fontSize: '12px',
    color: '#94a3b8',
  },

  // Footer
  footer: {
    padding: '20px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#64748b',
  },

  // Chat
  chatFab: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#10b981',
    color: '#fff',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatPanel: {
    position: 'fixed',
    bottom: '92px',
    right: '24px',
    width: '380px',
    maxWidth: 'calc(100vw - 48px)',
    height: '500px',
    maxHeight: 'calc(100vh - 120px)',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 1000,
    border: '1px solid #e2e8f0',
  },
  chatHeader: {
    padding: '16px',
    background: '#10b981',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    flexShrink: 0,
  },
  chatBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: '#f8fafc',
  },
  msgUser: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  msgBot: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  bubbleUser: {
    background: '#10b981',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: '12px 12px 2px 12px',
    fontSize: '14px',
    maxWidth: '80%',
    lineHeight: 1.5,
  },
  bubbleBot: {
    background: '#fff',
    color: '#0f172a',
    padding: '10px 14px',
    borderRadius: '12px 12px 12px 2px',
    fontSize: '14px',
    maxWidth: '85%',
    lineHeight: 1.5,
    border: '1px solid #e2e8f0',
  },
  chatQuick: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '12px 16px',
    background: '#fff',
    borderTop: '1px solid #e2e8f0',
    flexShrink: 0,
  },
  quickBtn: {
    background: '#f8fafc',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
  },
  chatInput: {
    display: 'flex',
    padding: '12px 16px',
    gap: '8px',
    background: '#fff',
    borderTop: '1px solid #e2e8f0',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
  },
  btnSend: {
    background: '#10b981',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};