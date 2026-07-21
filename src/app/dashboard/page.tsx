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
  Direct: '#6b7280',
  Other: '#6b7280',
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
  // Live submission stream (existing)
  const [data, setData] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [newCount, setNewCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const prevLengthRef = useRef(0);

  // Analytics state
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [platforms, setPlatforms] = useState<PlatformData[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [ads, setAds] = useState<AdData[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPageData[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Filters
  const [range, setRange] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [lpFilter, setLpFilter] = useState('all');

  // Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: "👋 Hi! I'm your Marketing Intelligence Assistant. Ask me anything about your leads, platforms, campaigns, or landing pages.",
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<
    'platforms' | 'campaigns' | 'ads' | 'landingPages' | 'leads'
  >('platforms');

  /* ── Existing live stream ── */
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

  // Re-fetch when new submissions arrive
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

  /* ── Filter data for display ── */
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

  /* ── Unique filter options ── */
  const uniquePlatforms = [...new Set(data.map((d) => d.platform))].filter(
    Boolean
  );
  const uniqueCampaigns = [...new Set(data.map((d) => d.campaign))].filter(
    Boolean
  );
  const uniqueLPs = [...new Set(data.map((d) => d.landingPage))].filter(Boolean);

  const handleDownload = () => {
    window.location.href = '/api/export';
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* ═══ HEADER ═══ */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logoContainer}>
              <div style={styles.logo}>TG</div>
              <div>
                <h1 style={styles.title}>Marketing Intelligence</h1>
                <p style={styles.subtitle}>
                  Track your marketing performance and lead journey
                </p>
              </div>
            </div>
          </div>
          <div style={styles.headerRight}>
            <div
              style={{
                ...styles.liveStatus,
                ...(connected ? styles.liveStatusActive : {}),
              }}
            >
              <span style={styles.liveDot} />
              <span style={styles.liveText}>
                {connected ? 'LIVE' : 'RECONNECTING'}
              </span>
            </div>
            <button onClick={handleDownload} style={styles.exportButton}>
              <span style={styles.buttonIcon}>↓</span>
              Export Excel
            </button>
          </div>
        </header>

        {lastUpdated && (
          <p style={styles.lastUpdated}>Last updated: {lastUpdated}</p>
        )}

        {/* New submission notification */}
        {newCount > 0 && (
          <div style={styles.notification}>
            <span style={styles.notificationIcon}>🎉</span>
            <span style={styles.notificationText}>
              +{newCount} new lead{newCount > 1 ? 's' : ''} received
            </span>
          </div>
        )}

        {/* ═══ FILTERS ═══ */}
        <div style={styles.filtersCard}>
          <div style={styles.filtersGrid}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>DATE RANGE</label>
              <select
                style={styles.filterSelect}
                value={range}
                onChange={(e) => setRange(e.target.value)}
              >
                {RANGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>PLATFORM</label>
              <select
                style={styles.filterSelect}
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
              >
                <option value="all">All Platforms</option>
                {uniquePlatforms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>CAMPAIGN</label>
              <select
                style={styles.filterSelect}
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
              >
                <option value="all">All Campaigns</option>
                {uniqueCampaigns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>LANDING PAGE</label>
              <select
                style={styles.filterSelect}
                value={lpFilter}
                onChange={(e) => setLpFilter(e.target.value)}
              >
                <option value="all">All Pages</option>
                {uniqueLPs.map((lp) => (
                  <option key={lp} value={lp}>
                    {lp}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ═══ KPI CARDS ═══ */}
        <div style={styles.kpiGrid}>
          <KpiCard
            label="TOTAL LEADS"
            value={overview?.totalLeads ?? 0}
            accent="#39ff14"
            loading={analyticsLoading}
            highlight
          />
          <KpiCard
            label="GOOGLE"
            value={overview?.platforms?.Google ?? 0}
            accent="#10b981"
            loading={analyticsLoading}
          />
          <KpiCard
            label="META"
            value={overview?.platforms?.Meta ?? 0}
            accent="#1877f2"
            loading={analyticsLoading}
          />
          <KpiCard
            label="YOUTUBE"
            value={overview?.platforms?.YouTube ?? 0}
            accent="#ff0000"
            loading={analyticsLoading}
          />
        </div>

        {/* ═══ TABS ═══ */}
        <div style={styles.tabsContainer}>
          {[
            { key: 'platforms', label: 'Platforms', icon: '🌐' },
            { key: 'campaigns', label: 'Campaigns', icon: '📢' },
            { key: 'ads', label: 'Ads', icon: '🎯' },
            { key: 'landingPages', label: 'Pages', icon: '🔗' },
            { key: 'leads', label: 'Leads', icon: '👥' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.key ? styles.tabActive : {}),
              }}
            >
              <span style={styles.tabIcon}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ═══ TAB CONTENT ═══ */}
        <div style={styles.contentCard}>
          {/* Platform Performance */}
          {activeTab === 'platforms' && (
            <div>
              <h2 style={styles.contentTitle}>Platform Performance</h2>
              {platforms.length === 0 ? (
                <p style={styles.emptyState}>No platform data available yet.</p>
              ) : (
                <div style={styles.platformGrid}>
                  {platforms.map((p) => (
                    <div key={p.platform} style={styles.platformCard}>
                      <div style={styles.platformHeader}>
                        <span
                          style={{
                            ...styles.platformDot,
                            background:
                              PLATFORM_COLORS[p.platform] || '#6b7280',
                          }}
                        />
                        <span style={styles.platformName}>{p.platform}</span>
                      </div>
                      <div style={styles.platformValue}>
                        {p.leads.toLocaleString()}
                      </div>
                      <div style={styles.platformLabel}>Leads</div>
                      <div style={styles.progressBar}>
                        <div
                          style={{
                            ...styles.progressFill,
                            width: `${p.percentage}%`,
                            background:
                              PLATFORM_COLORS[p.platform] || '#6b7280',
                          }}
                        />
                      </div>
                      <div style={styles.platformPercentage}>
                        {p.percentage.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Campaign Performance */}
          {activeTab === 'campaigns' && (
            <div>
              <h2 style={styles.contentTitle}>Campaign Performance</h2>
              {filteredCampaigns.length === 0 ? (
                <p style={styles.emptyState}>No campaign data available yet.</p>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table} className="dash-table">
                    <thead>
                      <tr style={styles.tableHeaderRow}>
                        <th style={styles.tableHeader}>#</th>
                        <th style={styles.tableHeader}>Campaign</th>
                        <th style={styles.tableHeader}>Platform</th>
                        <th style={styles.tableHeader}>Leads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCampaigns.map((c, i) => (
                        <tr key={c.campaign} style={styles.tableRow}>
                          <td style={styles.tableCell}>{i + 1}</td>
                          <td style={styles.tableCellBold}>{c.campaign}</td>
                          <td style={styles.tableCell}>
                            <span
                              style={{
                                ...styles.platformBadge,
                                background:
                                  PLATFORM_COLORS[c.platform] || '#6b7280',
                              }}
                            >
                              {c.platform}
                            </span>
                          </td>
                          <td style={styles.tableCellNumber}>
                            {c.leads.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Ad Performance */}
          {activeTab === 'ads' && (
            <div>
              <h2 style={styles.contentTitle}>Ad Performance</h2>
              {filteredAds.length === 0 ? (
                <p style={styles.emptyState}>No ad data available yet.</p>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table} className="dash-table">
                    <thead>
                      <tr style={styles.tableHeaderRow}>
                        <th style={styles.tableHeader}>#</th>
                        <th style={styles.tableHeader}>Ad</th>
                        <th style={styles.tableHeader}>Campaign</th>
                        <th style={styles.tableHeader}>Platform</th>
                        <th style={styles.tableHeader}>Leads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAds.map((a, i) => (
                        <tr key={a.ad} style={styles.tableRow}>
                          <td style={styles.tableCell}>{i + 1}</td>
                          <td style={styles.tableCellBold}>{a.ad}</td>
                          <td style={styles.tableCell}>{a.campaign}</td>
                          <td style={styles.tableCell}>
                            <span
                              style={{
                                ...styles.platformBadge,
                                background:
                                  PLATFORM_COLORS[a.platform] || '#6b7280',
                              }}
                            >
                              {a.platform}
                            </span>
                          </td>
                          <td style={styles.tableCellNumber}>
                            {a.leads.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Landing Page Performance */}
          {activeTab === 'landingPages' && (
            <div>
              <h2 style={styles.contentTitle}>Landing Page Performance</h2>
              {landingPages.length === 0 ? (
                <p style={styles.emptyState}>
                  No landing page data available yet.
                </p>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table} className="dash-table">
                    <thead>
                      <tr style={styles.tableHeaderRow}>
                        <th style={styles.tableHeader}>#</th>
                        <th style={styles.tableHeader}>Landing Page</th>
                        <th style={styles.tableHeader}>Leads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {landingPages.map((lp, i) => (
                        <tr key={lp.path} style={styles.tableRow}>
                          <td style={styles.tableCell}>{i + 1}</td>
                          <td style={styles.tableCellCode}>
                            <code style={styles.codeBlock}>{lp.path}</code>
                          </td>
                          <td style={styles.tableCellNumber}>
                            {lp.leads.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Lead Details */}
          {activeTab === 'leads' && (
            <div>
              <h2 style={styles.contentTitle}>
                Lead Details ({filteredLeads.length})
              </h2>
              {loading ? (
                <p style={styles.emptyState}>Connecting to live stream...</p>
              ) : filteredLeads.length === 0 ? (
                <p style={styles.emptyState}>No leads available yet.</p>
              ) : (
                <>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table} className="dash-table">
                      <thead>
                        <tr style={styles.tableHeaderRow}>
                          <th style={styles.tableHeader}>#</th>
                          <th style={styles.tableHeader}>Full Name</th>
                          <th style={styles.tableHeader}>Phone</th>
                          <th style={styles.tableHeader}>Platform</th>
                          <th style={styles.tableHeader}>Campaign</th>
                          <th style={styles.tableHeader}>Page</th>
                          <th style={styles.tableHeader}>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map((row) => (
                          <tr key={row.index} style={styles.tableRow}>
                            <td style={styles.tableCell}>{row.index}</td>
                            <td style={styles.tableCellBold}>{row.fullName}</td>
                            <td style={styles.tableCell}>{row.phone}</td>
                            <td style={styles.tableCell}>
                              <span
                                style={{
                                  ...styles.platformBadge,
                                  background:
                                    PLATFORM_COLORS[row.platform] || '#6b7280',
                                }}
                              >
                                {row.platform}
                              </span>
                            </td>
                            <td style={styles.tableCell}>
                              {row.campaign || '—'}
                            </td>
                            <td style={styles.tableCellCode}>
                              <code style={styles.codeBlock}>
                                {row.landingPage || '/'}
                              </code>
                            </td>
                            <td style={styles.tableCellMuted}>
                              {row.timestamp}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="dash-cards">
                    {filteredLeads.map((row) => (
                      <div key={row.index} style={styles.mobileCard}>
                        <div style={styles.mobileCardHeader}>
                          <span style={styles.mobileCardIndex}>
                            #{row.index}
                          </span>
                          <span
                            style={{
                              ...styles.platformBadgeSmall,
                              background:
                                PLATFORM_COLORS[row.platform] || '#6b7280',
                            }}
                          >
                            {row.platform}
                          </span>
                        </div>
                        <p style={styles.mobileCardName}>{row.fullName}</p>
                        <p style={styles.mobileCardPhone}>{row.phone}</p>
                        {row.campaign && (
                          <p style={styles.mobileCardMeta}>
                            Campaign: {row.campaign}
                          </p>
                        )}
                        <p style={styles.mobileCardTime}>{row.timestamp}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && data.length > 0 && (
          <div style={styles.footer}>
            Total: <strong>{data.length.toLocaleString()}</strong> submissions
          </div>
        )}
      </div>

      {/* ═══ CHATBOT FAB ═══ */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        style={styles.chatFab}
        aria-label="Toggle chat"
      >
        {chatOpen ? '✕' : '💬'}
      </button>

      {/* ═══ CHATBOT PANEL ═══ */}
      {chatOpen && (
        <div style={styles.chatPanel}>
          <div style={styles.chatHeader}>
            <span style={styles.chatHeaderIcon}>🤖</span>
            <span style={styles.chatHeaderTitle}>
              Marketing Intelligence Assistant
            </span>
          </div>

          <div style={styles.chatMessages}>
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                style={
                  msg.role === 'user'
                    ? styles.chatMessageUser
                    : styles.chatMessageAssistant
                }
              >
                <div
                  style={
                    msg.role === 'user'
                      ? styles.chatBubbleUser
                      : styles.chatBubbleAssistant
                  }
                >
                  {msg.text.split('\n').map((line, j) => (
                    <span key={j}>
                      {line
                        .replace(/\*\*(.*?)\*\*/g, '«$1»')
                        .split('«')
                        .map((part, k) => {
                          if (part.includes('»')) {
                            const [bold, rest] = part.split('»');
                            return (
                              <span key={k}>
                                <strong>{bold}</strong>
                                {rest}
                              </span>
                            );
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
              <div style={styles.chatMessageAssistant}>
                <div style={styles.chatBubbleAssistant}>
                  <span style={styles.chatLoading}>●●●</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={styles.chatQuickButtons}>
            {[
              'Which platform has the most leads?',
              'Top campaign?',
              'Compare Google and Meta',
            ].map((q) => (
              <button
                key={q}
                style={styles.quickButton}
                onClick={() => setChatInput(q)}
              >
                {q}
              </button>
            ))}
          </div>

          <div style={styles.chatInputContainer}>
            <input
              style={styles.chatInput}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder="Ask about your marketing data..."
              disabled={chatLoading}
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              style={{
                ...styles.chatSendButton,
                ...(chatLoading || !chatInput.trim()
                  ? styles.chatSendButtonDisabled
                  : {}),
              }}
            >
              Ask
            </button>
          </div>
        </div>
      )}

      <style>{`
        .dash-table { display: table; }
        .dash-cards { display: none; }
        
        @media (max-width: 768px) {
          .dash-table { display: none !important; }
          .dash-cards { display: flex; flex-direction: column; gap: 12px; }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

/* ─── KPI Card Component ─── */
function KpiCard({
  label,
  value,
  accent,
  loading,
  highlight = false,
}: {
  label: string;
  value: number;
  accent: string;
  loading: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        ...styles.kpiCard,
        ...(highlight ? styles.kpiCardHighlight : {}),
      }}
    >
      <div style={styles.kpiLabel}>{label}</div>
      <div style={{ ...styles.kpiValue, color: accent }}>
        {loading ? '—' : value.toLocaleString()}
      </div>
      <div style={{ ...styles.kpiAccent, background: accent }} />
    </div>
  );
}

/* ═══════════════════════════════════════
   STYLES - TG LEVELS BRAND
   ═══════════════════════════════════════ */
const styles: Record<string, React.CSSProperties> = {
  // ─── Page Layout ───
  page: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    background: 'linear-gradient(135deg, #0d2818 0%, #1a4d2e 50%, #0d2818 100%)',
    minHeight: '100vh',
    padding: '32px 20px',
    color: '#0d2818',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
  },

  // ─── Header ───
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '24px',
    marginBottom: '12px',
  },
  headerLeft: {
    flex: 1,
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logo: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #39ff14 0%, #10b981 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 900,
    color: '#0d2818',
    letterSpacing: '-1px',
    boxShadow: '0 8px 32px rgba(57, 255, 20, 0.3)',
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 900,
    color: '#ffffff',
    letterSpacing: '-0.5px',
    lineHeight: 1.2,
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: '14px',
    color: '#a3f0c3',
    fontWeight: 500,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  liveStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '100px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid rgba(255, 193, 7, 0.3)',
  },
  liveStatusActive: {
    background: 'rgba(57, 255, 20, 0.15)',
    border: '2px solid #39ff14',
  },
  liveDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#ffc107',
    animation: 'pulse 2s ease-in-out infinite',
  },
  liveText: {
    fontSize: '12px',
    fontWeight: 900,
    letterSpacing: '1px',
    color: '#39ff14',
  },
  exportButton: {
    background: '#39ff14',
    color: '#0d2818',
    border: 'none',
    padding: '12px 28px',
    borderRadius: '100px',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 20px rgba(57, 255, 20, 0.3)',
  },
  buttonIcon: {
    fontSize: '18px',
  },
  lastUpdated: {
    margin: '0 0 24px',
    fontSize: '13px',
    color: '#a3f0c3',
    fontWeight: 500,
  },

  // ─── Notification ───
  notification: {
    background: 'linear-gradient(135deg, #ffd60a 0%, #ffc107 100%)',
    color: '#0d2818',
    padding: '16px 24px',
    borderRadius: '20px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontWeight: 700,
    fontSize: '15px',
    boxShadow: '0 8px 32px rgba(255, 214, 10, 0.4)',
    animation: 'slideIn 0.5s ease-out',
  },
  notificationIcon: {
    fontSize: '24px',
  },
  notificationText: {
    flex: 1,
  },

  // ─── Filters ───
  filtersCard: {
    background: '#ffffff',
    borderRadius: '24px',
    padding: '32px',
    marginBottom: '32px',
    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)',
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '24px',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '1px',
    color: '#1a4d2e',
    textTransform: 'uppercase',
  },
  filterSelect: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid #e8f5e9',
    background: '#ffffff',
    color: '#0d2818',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.3s ease',
  },

  // ─── KPI Cards ───
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  kpiCard: {
    background: '#ffffff',
    borderRadius: '24px',
    padding: '32px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  kpiCardHighlight: {
    background: 'linear-gradient(135deg, #0d2818 0%, #1a4d2e 100%)',
  },
  kpiLabel: {
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '1.5px',
    color: '#1a4d2e',
    marginBottom: '12px',
  },
  kpiValue: {
    fontSize: '48px',
    fontWeight: 900,
    lineHeight: 1,
    marginBottom: '8px',
  },
  kpiAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '6px',
    borderRadius: '0 0 24px 24px',
  },

  // ─── Tabs ───
  tabsContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '2px',
    overflowX: 'auto',
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '8px',
    borderRadius: '20px 20px 0 0',
  },
  tab: {
    padding: '14px 24px',
    border: 'none',
    background: 'transparent',
    color: '#a3f0c3',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    borderRadius: '14px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    background: '#39ff14',
    color: '#0d2818',
    boxShadow: '0 4px 16px rgba(57, 255, 20, 0.3)',
  },
  tabIcon: {
    fontSize: '18px',
  },

  // ─── Content Card ───
  contentCard: {
    background: '#ffffff',
    borderRadius: '0 0 24px 24px',
    padding: '40px',
    minHeight: '400px',
    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)',
  },
  contentTitle: {
    margin: '0 0 32px',
    fontSize: '28px',
    fontWeight: 900,
    color: '#0d2818',
    letterSpacing: '-0.5px',
  },
  emptyState: {
    color: '#6b7280',
    fontSize: '16px',
    textAlign: 'center',
    padding: '80px 20px',
    fontWeight: 500,
  },

  // ─── Platform Grid ───
  platformGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '20px',
  },
  platformCard: {
    background: '#f8fffe',
    borderRadius: '20px',
    padding: '28px',
    border: '2px solid #e8f5e9',
    transition: 'all 0.3s ease',
  },
  platformHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  platformDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  platformName: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#0d2818',
  },
  platformValue: {
    fontSize: '42px',
    fontWeight: 900,
    color: '#0d2818',
    lineHeight: 1,
    marginBottom: '12px',
  },
  platformLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '16px',
  },
  progressBar: {
    height: '8px',
    background: '#e8f5e9',
    borderRadius: '100px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressFill: {
    height: '100%',
    borderRadius: '100px',
    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  platformPercentage: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#1a4d2e',
  },

  // ─── Table ───
  tableWrapper: {
    background: '#f8fffe',
    borderRadius: '20px',
    overflow: 'auto',
    border: '2px solid #e8f5e9',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeaderRow: {
    background: '#e8f5e9',
  },
  tableHeader: {
    padding: '18px 20px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '1.5px',
    color: '#1a4d2e',
    textTransform: 'uppercase',
    borderBottom: '2px solid #10b981',
  },
  tableRow: {
    borderBottom: '1px solid #e8f5e9',
    transition: 'background 0.2s ease',
  },
  tableCell: {
    padding: '16px 20px',
    fontSize: '14px',
    color: '#374151',
    fontWeight: 500,
  },
  tableCellBold: {
    padding: '16px 20px',
    fontSize: '14px',
    color: '#0d2818',
    fontWeight: 700,
  },
  tableCellNumber: {
    padding: '16px 20px',
    fontSize: '16px',
    color: '#0d2818',
    fontWeight: 900,
  },
  tableCellMuted: {
    padding: '16px 20px',
    fontSize: '13px',
    color: '#9ca3af',
    fontWeight: 500,
  },
  tableCellCode: {
    padding: '16px 20px',
  },
  platformBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '100px',
    fontSize: '12px',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '0.5px',
  },
  platformBadgeSmall: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '100px',
    fontSize: '11px',
    fontWeight: 800,
    color: '#ffffff',
  },
  codeBlock: {
    background: '#e8f5e9',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'monospace',
    color: '#1a4d2e',
    fontWeight: 600,
  },

  // ─── Mobile Cards ───
  mobileCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    border: '2px solid #e8f5e9',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
  },
  mobileCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  mobileCardIndex: {
    fontSize: '12px',
    fontWeight: 800,
    color: '#6b7280',
  },
  mobileCardName: {
    margin: '0 0 4px',
    fontSize: '16px',
    fontWeight: 800,
    color: '#0d2818',
  },
  mobileCardPhone: {
    margin: '0 0 8px',
    fontSize: '14px',
    color: '#374151',
    fontWeight: 600,
  },
  mobileCardMeta: {
    margin: '0 0 4px',
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 500,
  },
  mobileCardTime: {
    margin: 0,
    fontSize: '11px',
    color: '#9ca3af',
    fontWeight: 500,
  },

  // ─── Footer ───
  footer: {
    padding: '24px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#a3f0c3',
    fontWeight: 600,
  },

  // ─── Chatbot ───
  chatFab: {
    position: 'fixed',
    bottom: '32px',
    right: '32px',
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #39ff14 0%, #10b981 100%)',
    border: 'none',
    color: '#0d2818',
    fontSize: '28px',
    cursor: 'pointer',
    boxShadow: '0 8px 32px rgba(57, 255, 20, 0.4)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  chatPanel: {
    position: 'fixed',
    bottom: '112px',
    right: '32px',
    width: '420px',
    maxWidth: 'calc(100vw - 64px)',
    height: '600px',
    maxHeight: 'calc(100vh - 144px)',
    background: '#ffffff',
    borderRadius: '24px',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 1000,
    border: '2px solid #e8f5e9',
  },
  chatHeader: {
    background: 'linear-gradient(135deg, #0d2818 0%, #1a4d2e 100%)',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  chatHeaderIcon: {
    fontSize: '24px',
  },
  chatHeaderTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.3px',
  },
  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    background: '#f8fffe',
  },
  chatMessageUser: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  chatMessageAssistant: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  chatBubbleUser: {
    background: '#39ff14',
    color: '#0d2818',
    padding: '12px 18px',
    borderRadius: '20px 20px 4px 20px',
    fontSize: '14px',
    maxWidth: '80%',
    lineHeight: 1.6,
    fontWeight: 600,
    boxShadow: '0 4px 16px rgba(57, 255, 20, 0.2)',
  },
  chatBubbleAssistant: {
    background: '#ffffff',
    color: '#0d2818',
    padding: '12px 18px',
    borderRadius: '20px 20px 20px 4px',
    fontSize: '14px',
    maxWidth: '85%',
    lineHeight: 1.6,
    border: '2px solid #e8f5e9',
    fontWeight: 500,
  },
  chatLoading: {
    fontSize: '20px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  chatQuickButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '16px 24px',
    background: '#ffffff',
    borderTop: '1px solid #e8f5e9',
    flexShrink: 0,
  },
  quickButton: {
    background: '#f8fffe',
    color: '#1a4d2e',
    border: '2px solid #e8f5e9',
    padding: '10px 16px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  chatInputContainer: {
    display: 'flex',
    padding: '20px 24px',
    gap: '12px',
    background: '#ffffff',
    borderTop: '2px solid #e8f5e9',
    flexShrink: 0,
  },
  chatInput: {
    flex: 1,
    padding: '14px 18px',
    borderRadius: '14px',
    border: '2px solid #e8f5e9',
    background: '#f8fffe',
    color: '#0d2818',
    fontSize: '14px',
    fontWeight: 600,
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  chatSendButton: {
    background: '#39ff14',
    color: '#0d2818',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '14px',
    fontSize: '14px',
    fontWeight: 900,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 16px rgba(57, 255, 20, 0.3)',
  },
  chatSendButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};