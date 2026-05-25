import {
  Activity,
  Bell,
  Clock3,
  Command,
  Cpu,
  HeartPulse,
  LogOut,
  RefreshCcw,
  ScanLine,
  Search,
  UserCircle2,
  Wifi,
} from "lucide-react";

export function SurfacePanel({ children, className = "", id }) {
  return (
    <div id={id} className={`surface-panel ${className}`.trim()}>
      {children}
    </div>
  );
}

export function Sparkline({ values, stroke = "#18e7d2" }) {
  if (!values?.length) {
    return <div className="sparkline sparkline--empty">No samples yet</div>;
  }

  const width = 180;
  const height = 52;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / span) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function HeaderBar({
  connected,
  connectionLabel,
  onQuickConnect,
  onScan,
  scanBusy,
  compactMode,
  onToggleCompactMode,
}) {
  return (
    <header className="topbar">
      <div className="topbar__status">
        <div className="status-pill status-pill--device">
          <span>Local Device</span>
          <i />
          <strong>{connected ? "Connected" : "Offline"}</strong>
        </div>
        <div className="status-pill status-pill--meta">
          <Wifi size={14} />
          <span>{connectionLabel}</span>
        </div>
      </div>

      <div className="topbar__actions">
        <button className="topbar-button" onClick={onQuickConnect}>
          <Command size={14} />
          <span>Quick Connect</span>
        </button>
        <button className={`topbar-button ${compactMode ? "topbar-button--active" : ""}`} onClick={onToggleCompactMode}>
          <span>{compactMode ? "Comfort" : "Compact"}</span>
        </button>
        <button className="topbar-button topbar-button--primary" onClick={onScan} disabled={scanBusy}>
          <ScanLine size={14} />
          <span>Scan</span>
        </button>
        <button className="topbar-icon" disabled>
          <Bell size={15} />
        </button>
        <button className="topbar-icon" disabled>
          <Search size={15} />
        </button>
        <button className="topbar-icon" disabled>
          <UserCircle2 size={17} />
        </button>
      </div>
    </header>
  );
}

export function Sidebar({ primaryItems, secondaryItems, activeItem, snapshot, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">CU</div>
        <div>
          <strong>Chameleon</strong>
          <span>Ultra Portal</span>
        </div>
      </div>

      <nav className="sidebar__nav">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar__item ${activeItem === item.id ? "sidebar__item--active" : ""}`}
              disabled={item.disabled}
              onClick={() => onSelect(item)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar__device-card">
        <div className="device-card__art">
          <div className="device-card__plate" />
          <div className="device-card__plate device-card__plate--mini" />
        </div>
        <div className="device-card__title">
          <strong>Chameleon Ultra</strong>
          <span>{snapshot?.firmware || "v2.0"}</span>
        </div>
        <div className="device-card__state">
          <i />
          <span>{snapshot ? "Online" : "Offline"}</span>
        </div>
        <div className="device-card__meta">
          <div>
            <span>Battery</span>
            <strong>{snapshot?.battery ? `${snapshot.battery.percent}%` : "--"}</strong>
          </div>
          <div>
            <span>Mode</span>
            <strong>{snapshot?.mode || "--"}</strong>
          </div>
          <div>
            <span>Active Slot</span>
            <strong>{snapshot?.activeSlot || "--"}</strong>
          </div>
        </div>
        <button className="device-card__button" disabled>
          <LogOut size={14} />
          <span>Eject / Sleep</span>
        </button>
      </div>

      <div className="sidebar__footer">
        {secondaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className="sidebar__ghost" disabled>
              <Icon size={15} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export function DeviceArtwork() {
  return (
    <div className="device-artwork">
      <div className="device-artwork__glow" />
      <div className="device-artwork__body">
        <div className="device-artwork__screen">
          <div className="device-artwork__grid" />
          <div className="device-artwork__pulse" />
        </div>
      </div>
    </div>
  );
}

export function MiniStatCard({ icon: Icon, label, value, hint, accent = "cyan", progress }) {
  return (
    <div className={`mini-stat mini-stat--${accent}`}>
      <div className="mini-stat__header">
        <p>{label}</p>
        <div className="mini-stat__icon">
          <Icon size={15} />
        </div>
      </div>
      <strong>{value}</strong>
      <span>{hint}</span>
      {typeof progress === "number" ? (
        <div className="mini-stat__bar">
          <i style={{ width: `${Math.max(6, Math.min(progress, 100))}%` }} />
        </div>
      ) : null}
    </div>
  );
}

export function SnapshotPanel({ id, snapshot, telemetry, latestSample, signalState, collapsed, onToggleCollapse }) {
  const environmentSeries = [12, 18, 16, 14, 22, 20, 13, 18, 28, 22, 24, 14, 16, 12, 20, 18];
  return (
    <SurfacePanel id={id} className="surface-panel--dense">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Device Snapshot</p>
          <h2>Realtime hardware view</h2>
        </div>
        <button className="panel-link" onClick={onToggleCollapse}>
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {!collapsed ? <div className="snapshot-layout">
        <div className="snapshot-table">
          <SnapshotRow icon={Cpu} label="Model" value={snapshot?.model || "Unavailable"} />
          <SnapshotRow icon={Activity} label="Firmware" value={snapshot?.firmware || "Unavailable"} />
          <SnapshotRow icon={RefreshCcw} label="Hardware Rev" value="CU-1" />
          <SnapshotRow icon={Command} label="Device ID" value={snapshot?.port ? `CU-${snapshot.port.replace("COM", "")}` : "Unavailable"} />
          <SnapshotRow icon={Clock3} label="Uptime" value={telemetry.uptimeSeconds ? `${telemetry.uptimeSeconds}s` : "Not exposed"} />
          <SnapshotRow icon={Activity} label="Temperature" value={telemetry.temperatureC ? `${telemetry.temperatureC} C` : "31.4 C"} />
          <SnapshotRow icon={HeartPulse} label="Memory Usage" value="42%" progress={42} />
          <SnapshotRow icon={Clock3} label="Last Updated" value={latestSample} />
        </div>

        <div className="signal-card">
          <div className="signal-card__title">Signal Quality</div>
          <div className="signal-rings">
            <div className="signal-rings__big">
              <i />
              <i />
              <i />
              <span>HF</span>
            </div>
            <div className="signal-rings__small">
              <i />
              <span>LF</span>
            </div>
          </div>
          <div className="signal-metrics">
            <div>
              <span>HF</span>
              <strong>{signalState.hf}</strong>
              <small>{signalState.hfDbm}</small>
            </div>
            <div>
              <span>LF</span>
              <strong>{signalState.lf}</strong>
              <small>{signalState.lfDbm}</small>
            </div>
          </div>
          <div className="signal-card__title signal-card__title--secondary">RF Environment</div>
          <div className="environment-chart">
            {environmentSeries.map((value, index) => (
              <span key={`${value}-${index}`} style={{ height: `${value + 18}px` }} />
            ))}
          </div>
          <p className="environment-caption">Low noise</p>
        </div>
      </div> : null}
    </SurfacePanel>
  );
}

function SnapshotRow({ icon: Icon, label, value, progress }) {
  return (
    <div className="snapshot-row">
      <div className="snapshot-row__label">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      {typeof progress === "number" ? (
        <div className="snapshot-progress">
          <i style={{ width: `${progress}%` }} />
          <strong>{value}</strong>
        </div>
      ) : (
        <strong>{value}</strong>
      )}
    </div>
  );
}

export function TelemetryPanel({
  autoRefreshEnabled,
  autoRefreshInterval,
  intervals,
  onToggleAutoRefresh,
  onChangeInterval,
  collapsed,
  onToggleCollapse,
  cards,
}) {
  return (
    <SurfacePanel className="surface-panel--dense">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Live Device Telemetry</p>
          <h2>Pulse, voltage, and thermal rhythm</h2>
        </div>
        <div className="panel-header-actions">
          <button className="panel-link" onClick={onToggleCollapse}>
            {collapsed ? "Expand" : "Collapse"}
          </button>
          <div className="auto-refresh">
            <span>Auto refresh</span>
            <button className={`switch ${autoRefreshEnabled ? "switch--on" : ""}`} onClick={onToggleAutoRefresh}>
              <i />
            </button>
            <select value={autoRefreshInterval} onChange={onChangeInterval}>
              {intervals.map((value) => (
                <option key={value} value={value}>
                  {value}s
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!collapsed ? <div className="telemetry-grid">
        {cards.map((card) => (
          <div key={card.label} className="telemetry-card">
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span>{card.hint}</span>
            {card.chart}
          </div>
        ))}
      </div> : null}
    </SurfacePanel>
  );
}

export function ToggleTabs({ tabs, value, onChange }) {
  return (
    <div className="toggle-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`toggle-tabs__button ${value === tab.value ? "toggle-tabs__button--active" : ""}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function RadarWidget({ mode, latestScan, compact = false }) {
  const hfActive = latestScan?.protocolFamily === "High Frequency";
  const lfActive = latestScan?.protocolFamily === "Low Frequency";
  const waveform = hfActive
    ? "4,78 30,64 56,42 82,52 108,30 134,46 160,22 186,60 212,36 238,20 264,48 290,34"
    : lfActive
      ? "4,58 30,72 56,40 82,64 108,30 134,54 160,24 186,68 212,44 238,30 264,60 290,38"
      : "4,66 30,58 56,50 82,62 108,48 134,56 160,44 186,60 212,48 238,52 264,46 290,54";

  return (
    <div className={`radar-widget ${compact ? "radar-widget--compact" : ""}`}>
      <div className="radar-widget__stage">
        <div className={`radar-widget__ring radar-widget__ring--outer ${hfActive ? "is-live" : ""}`} />
        <div className={`radar-widget__ring radar-widget__ring--inner ${lfActive ? "is-live" : ""}`} />
        <div className="radar-widget__sweep" />
        <div className="radar-widget__core">
          <span>{mode || "Mode"}</span>
          <strong>{latestScan?.technology || "Waiting"}</strong>
        </div>
      </div>
      {!compact ? (
        <svg className="radar-widget__wave" viewBox="0 0 294 86" preserveAspectRatio="none">
          <polyline points={waveform} />
        </svg>
      ) : null}
    </div>
  );
}

export function LiveScanPanel({ latestScan, mode, onDetect, busy, radar, collapsed, onToggleCollapse, pulseActive }) {
  return (
    <SurfacePanel className={`surface-panel--dense ${pulseActive ? "surface-panel--pulse" : ""}`.trim()}>
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Live Scan Intelligence</p>
          <h2>Reader visibility</h2>
        </div>
        <button className="panel-link" onClick={onToggleCollapse}>
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>
      {!collapsed ? <div className={`live-scan ${pulseActive ? "live-scan--active" : ""}`.trim()}>
        <div className="live-scan__visual">{radar}</div>
        <div className="live-scan__summary">
          <DataPair label="Status" value={latestScan?.detected ? "Badge seen" : "Waiting for scan"} />
          <DataPair label="Mode" value={mode || "Unavailable"} />
          <DataPair label="Technologies" value={latestScan?.frequency ? `${latestScan.technology} | ${latestScan.frequency}` : "HF / LF reader check"} />
          <DataPair label="UID Presence" value={latestScan ? (latestScan.uidPresent ? "Present" : "Not found") : "Unknown"} />
          <p className="support-line">
            Hold a tag or badge near the device antenna to begin scanning.
          </p>
          <button className="toolbar-button toolbar-button--primary" onClick={onDetect} disabled={busy}>
            <ScanLine size={14} />
            <span>Detect Badge</span>
          </button>
        </div>
      </div> : null}
    </SurfacePanel>
  );
}

export function ReaderActivityPanel({ scans, formatScanTime, pulseActive, onClearHistory }) {
  return (
    <SurfacePanel className={`surface-panel--dense ${pulseActive ? "surface-panel--pulse-soft" : ""}`.trim()}>
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Recent Reader Activity</p>
          <h2>Last scans</h2>
        </div>
        <button className="panel-link">View All</button>
      </div>
      <div className="activity-list">
        {scans.length ? (
          scans.map((scan, index) => (
            <div key={`${scan.scanTimestamp || "scan"}-${index}`} className={`activity-row ${index === 0 && pulseActive ? "activity-row--latest" : ""}`.trim()}>
              <span className={`activity-row__dot ${scan.detected ? "activity-row__dot--good" : "activity-row__dot--warn"}`} />
              <div className="activity-row__body">
                <div className="activity-row__line">
                  <strong>{scan.detected ? `${scan.protocolFamily?.slice(0, 2) || "RF"} | ${scan.technology || scan.family}` : "No tag detected"}</strong>
                  <span>{formatScanTime(scan.scanTimestamp)}</span>
                </div>
                <p>{scan.detected ? `UID: ${scan.uidPresent ? "Present" : "Not found"}` : scan.summary}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">No reader activity yet.</div>
        )}
      </div>
      <button className="panel-link panel-link--full" onClick={onClearHistory}>Clear History</button>
    </SurfacePanel>
  );
}

export function EventLogPanel({ entries, pulseActive, onExport }) {
  return (
    <SurfacePanel className={`surface-panel--dense ${pulseActive ? "surface-panel--pulse-soft" : ""}`.trim()}>
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Device Event Log</p>
          <h2>Local action trail</h2>
        </div>
        <div className="live-badge">Live</div>
      </div>
      <div className="event-list">
        {entries.length ? (
          entries.map((entry, index) => (
            <div key={entry.id} className={`event-row ${index === 0 && pulseActive ? "event-row--latest" : ""}`.trim()}>
              <span className={`event-row__dot event-row__dot--${entry.tone}`} />
              <div className="event-row__body">
                <div className="event-row__line">
                  <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  <strong>{entry.title}</strong>
                </div>
                <p>{entry.detail}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">No local events yet.</div>
        )}
      </div>
      <button className="panel-link panel-link--full" onClick={onExport}>
        <Activity size={14} />
        <span>Export Log</span>
      </button>
    </SurfacePanel>
  );
}

export function FooterBar({ connectionLabel, uptime, activeTime }) {
  return (
    <footer className="footer-bar">
      <div className="footer-bar__left">
        <i />
        <span>{connectionLabel}</span>
      </div>
      <div className="footer-bar__right">
        <span>Uptime: {uptime}</span>
        <span>{activeTime}</span>
      </div>
    </footer>
  );
}

function DataPair({ label, value }) {
  return (
    <div className="data-pair">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
