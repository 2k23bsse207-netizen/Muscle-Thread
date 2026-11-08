import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  Copy,
  Globe,
  KeyRound,
  LogOut,
  RotateCcw,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useMe } from '../../../hooks/useQueries';
import { useAuthStore } from '../../../stores/authStore';
import { LIME } from '../../theme';
import AdminLayout from './Adminlayout';
import { PageHeader, card, kicker } from './Ui';

function SettingsRow({
  icon: Icon,
  label,
  value,
  action,
}: {
  icon?: typeof ShieldCheck;
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between border-b border-black/[0.05] last:border-0">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#F0F2E9] text-[#555E45]">
            <Icon size={15} />
          </span>
        )}
        <span className="text-xs font-semibold text-[#181B15]/75">{label}</span>
      </div>
      <div className="flex items-center gap-2 pl-11 sm:pl-0">
        <span className="text-xs font-bold text-[#181B15]">{value}</span>
        {action}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { data, isLoading, isError, error, refetch } = useMe();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [copiedId, setCopiedId] = useState(false);
  const [stockAlerts, setStockAlerts] = useState(true);
  const [orderPings, setOrderPings] = useState(true);

  const signOut = () => {
    logout();
    navigate('/');
  };

  const copyAccountId = (id: string) => {
    void navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (isLoading) {
    return (
      <AdminLayout active="Settings">
        <PageHeader
          title="Console Settings"
          sub="Your admin account, security credentials, and console preferences."
          badge="SETTINGS"
        />

        <div className="mt-7 grid gap-6 lg:grid-cols-3">
          <div className={`lg:col-span-2 ${card} animate-pulse p-6 sm:p-8 space-y-6`}>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-[#E8E6DF]" />
              <div className="space-y-2">
                <div className="h-5 w-36 rounded bg-[#E8E6DF]" />
                <div className="h-3 w-48 rounded bg-[#E8E6DF]" />
              </div>
            </div>
            <div className="space-y-4 pt-4">
              <div className="h-4 w-full rounded bg-[#E8E6DF]" />
              <div className="h-4 w-5/6 rounded bg-[#E8E6DF]" />
              <div className="h-4 w-3/4 rounded bg-[#E8E6DF]" />
            </div>
          </div>
          <div className={`${card} animate-pulse p-6 sm:p-8 space-y-4`}>
            <div className="h-4 w-24 rounded bg-[#E8E6DF]" />
            <div className="h-12 w-full rounded bg-[#E8E6DF]" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isError || !data) {
    return (
      <AdminLayout active="Settings">
        <PageHeader
          title="Console Settings"
          sub="Your admin account, security credentials, and console preferences."
          badge="SETTINGS"
        />

        <div className={`mt-7 max-w-xl ${card} p-8 text-center sm:text-left`}>
          <div className="mx-auto sm:mx-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle size={24} />
          </div>
          <h2 className="mt-4 text-base font-bold text-[#181B15]">Unable to load account settings</h2>
          <p className="mt-1 text-xs text-[#181B15]/60">
            {error instanceof Error ? error.message : 'Could not retrieve your admin session credentials.'}
          </p>
          <button
            onClick={() => void refetch()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#181B15] px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition hover:bg-[#20251D]"
          >
            <RotateCcw size={13} />
            Try again
          </button>
        </div>
      </AdminLayout>
    );
  }

  const user = data.user;
  const initials =
    user.name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AD';

  return (
    <AdminLayout active="Settings">
      <PageHeader
        title="Console Settings"
        sub="Your admin account, security credentials, and console preferences."
        badge="PRODUCTION ACTIVE"
      />

      <div className="mt-7 grid gap-6 lg:grid-cols-3">
        {/* Left Column: Account Profile & Preferences */}
        <div className="space-y-6 lg:col-span-2">
          {/* Identity & Account Card */}
          <div className={`${card} p-6 sm:p-8`}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between border-b border-black/[0.06] pb-6">
              <div className="flex items-center gap-4">
                <div
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-xl font-black text-[#181B15] shadow-inner"
                  style={{ background: LIME }}
                >
                  {initials}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black tracking-tight text-[#181B15]">{user.name}</h2>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
                      style={{
                        background: user.role === 'ADMIN' ? '#181B15' : '#ECEFE6',
                        color: user.role === 'ADMIN' ? LIME : '#525B42',
                      }}
                    >
                      <ShieldCheck size={11} />
                      {user.role === 'ADMIN' ? 'Administrator' : 'Standard User'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#181B15]/60 font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                {user.emailVerified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    Email Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/20 bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-700">
                    Pending Verification
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2">
              <SettingsRow
                icon={UserIcon}
                label="Full name"
                value={user.name}
              />
              <SettingsRow
                icon={KeyRound}
                label="Account ID"
                value={
                  <span className="font-mono text-[11px] text-[#181B15]/75">
                    {user.id || 'usr_prod_01k9'}
                  </span>
                }
                action={
                  user.id ? (
                    <button
                      onClick={() => copyAccountId(user.id)}
                      className="rounded-lg p-1 text-black/35 transition hover:bg-black/5 hover:text-black"
                      title="Copy account ID"
                    >
                      <Copy size={13} />
                      <span className="sr-only">Copy</span>
                      {copiedId && (
                        <span className="absolute -top-6 right-0 rounded bg-[#181B15] px-1.5 py-0.5 text-[8px] font-bold text-white">
                          Copied
                        </span>
                      )}
                    </button>
                  ) : null
                }
              />
              <SettingsRow
                icon={Clock}
                label="Member since"
                value={new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              />
              <SettingsRow
                icon={ShieldCheck}
                label="Security Tier"
                value="Enterprise Role-Based Access"
              />
            </div>
          </div>

          {/* Console Preferences Card */}
          <div className={`${card} p-6 sm:p-8`}>
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
              <div>
                <span className={kicker}>Operations</span>
                <h3 className="text-sm font-bold text-[#181B15]">Console Preferences</h3>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#F0F2E9] text-[#555E45]">
                <Globe size={15} />
              </span>
            </div>

            <div className="pt-2">
              <SettingsRow
                label="Primary Warehouse Hub"
                value="WH-Seattle (West Coast Logistics)"
              />
              <SettingsRow
                label="Operational Currency"
                value="USD ($) Omnichannel"
              />
              <SettingsRow
                label="Replenishment Alert Threshold"
                value="≤ 10 Units"
              />

              <div className="flex items-center justify-between py-4 border-b border-black/[0.05]">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#F0F2E9] text-[#555E45]">
                    <Bell size={15} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#181B15]">Low Stock Push Alerts</p>
                    <p className="text-[10px] text-black/40">Notify when SKU drops below threshold</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStockAlerts((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    stockAlerts ? 'bg-[#181B15]' : 'bg-black/15'
                  }`}
                  role="switch"
                  aria-checked={stockAlerts}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      stockAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                    style={stockAlerts ? { background: LIME } : undefined}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-4 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#F0F2E9] text-[#555E45]">
                    <Bell size={15} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#181B15]">Realtime Order Notifications</p>
                    <p className="text-[10px] text-black/40">Flash banner on paid transactions</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderPings((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    orderPings ? 'bg-[#181B15]' : 'bg-black/15'
                  }`}
                  role="switch"
                  aria-checked={orderPings}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      orderPings ? 'translate-x-5' : 'translate-x-0'
                    }`}
                    style={orderPings ? { background: LIME } : undefined}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Session & Danger Zone */}
        <div className="space-y-6">
          {/* Active Session Card */}
          <div className={`${card} p-6 sm:p-7`}>
            <span className={kicker}>Security</span>
            <h3 className="mt-1 text-sm font-bold text-[#181B15]">Active Session</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#181B15]/60">
              Your session is authenticated via secure HTTP-only cookies and in-memory authorization tokens.
            </p>

            <div className="mt-5 rounded-xl border border-black/[0.06] bg-[#F9FAF6] p-4 text-xs space-y-2.5">
              <div className="flex justify-between items-center text-black/50">
                <span>Protocol:</span>
                <span className="font-mono font-bold text-[#181B15]">TLS 1.3 / Bearer</span>
              </div>
              <div className="flex justify-between items-center text-black/50">
                <span>Status:</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Authenticated
                </span>
              </div>
              <div className="flex justify-between items-center text-black/50">
                <span>Token Refresh:</span>
                <span className="font-semibold text-[#181B15]">Automatic</span>
              </div>
            </div>
          </div>

          {/* Session Termination Card */}
          <div className={`${card} border-red-500/15 p-6 sm:p-7`}>
            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-red-600">
              Session Control
            </span>
            <h3 className="mt-1 text-sm font-bold text-[#181B15]">Sign Out</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#181B15]/60">
              Signing out invalidates your current administrative access token and closes the console session on this device.
            </p>

            <button
              onClick={signOut}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#181B15] px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-red-600 hover:text-white"
            >
              <LogOut size={14} />
              Log out of console
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
