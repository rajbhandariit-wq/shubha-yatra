import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, Clock, CheckCircle, TrendingUp, Users, RefreshCw,
  ChevronDown, ChevronUp, Filter, Download, Plus, Settings,
  AlertTriangle, XCircle, Eye, Banknote, Calendar, BarChart2,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { billingAPI } from '../../services/api';
import toast from 'react-hot-toast';

// ─── Shared helpers ───────────────────────────────────────────────────────────
const fmt = (n) => `NPR ${parseFloat(n || 0).toLocaleString('en-NP', { minimumFractionDigits: 2 })}`;

const STATUS_COLORS = {
  pending:          'bg-yellow-100 text-yellow-700',
  held:             'bg-blue-100 text-blue-700',
  released:         'bg-purple-100 text-purple-700',
  paid:             'bg-green-100 text-green-700',
  refunded:         'bg-gray-100 text-gray-500',
  draft:            'bg-gray-100 text-gray-600',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved:         'bg-blue-100 text-blue-700',
  rejected:         'bg-red-100 text-red-700',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-500'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-nepal-blue' }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <Icon className={`h-6 w-6 ${color}`} />
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
      <p className="text-2xl font-extrabold text-gray-800 truncate">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// ─── TAB: Dashboard ───────────────────────────────────────────────────────────
function DashboardTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    billingAPI.getDashboard()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load billing dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const handleSync = async () => {
    try {
      const r = await billingAPI.syncTransactions();
      toast.success(r.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Sync failed'); }
  };

  const handleNightly = async () => {
    try {
      const r = await billingAPI.runNightly();
      toast.success(r.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock}       label="Pending Balance"      value={fmt(data?.pendingTotal)}      sub="Awaiting trip"    color="text-yellow-500" />
        <StatCard icon={Banknote}    label="Held (post-trip)"     value={fmt(data?.heldTotal)}         sub="Ready to batch"   color="text-blue-500"   />
        <StatCard icon={DollarSign}  label="Released in Batches"  value={fmt(data?.releasedTotal)}     sub="Awaiting payment"  color="text-purple-500" />
        <StatCard icon={CheckCircle} label="Paid This Month"      value={fmt(data?.paidThisMonth)}     sub="Operators received" color="text-green-500" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp}  label="Platform Commission"  value={fmt(data?.commissionThisMonth)} sub="This month"      color="text-nepal-red"  />
        <StatCard icon={AlertTriangle} label="Batches Awaiting Approval" value={data?.batchesPending ?? 0} sub="Need review"   color="text-orange-500" />
        <StatCard icon={CheckCircle} label="Approved Batches"     value={data?.batchesApproved ?? 0}   sub="Ready to pay"     color="text-blue-500"   />
        <StatCard icon={Clock}       label="Avg Settlement Days"  value={`${data?.avgSettlementDays ?? 0}d`} sub="Booking→paid" color="text-gray-500"  />
      </div>

      {/* Recent batches */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Recent Payout Batches</h3>
          <div className="flex gap-2">
            <button onClick={handleNightly} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
              Run Nightly Job
            </button>
            <button onClick={handleSync} className="text-xs px-3 py-1.5 bg-nepal-blue text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> Sync Bookings
            </button>
          </div>
        </div>
        {data?.recentBatches?.length === 0
          ? <p className="text-center text-gray-400 py-8">No batches yet</p>
          : (
            <table className="w-full text-sm">
              <thead><tr className="border-b">{['Batch #', 'Operator', 'Period', 'Net (NPR)', 'Status', ''].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase pb-2 pr-4">{h}</th>
              ))}</tr></thead>
              <tbody className="divide-y divide-gray-50">
                {(data?.recentBatches || []).map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4 font-mono text-xs text-gray-600">{b.batchNumber}</td>
                    <td className="py-2.5 pr-4 font-medium">{b.provider?.companyName || b.provider?.name}</td>
                    <td className="py-2.5 pr-4 text-xs text-gray-500">{b.periodStart} → {b.periodEnd}</td>
                    <td className="py-2.5 pr-4 font-semibold">{fmt(b.totalNet)}</td>
                    <td className="py-2.5 pr-4"><StatusBadge status={b.status} /></td>
                    <td className="py-2.5"><Link to={`/admin/billing/batches/${b.id}`} className="text-nepal-blue text-xs hover:underline">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}

// ─── TAB: Operators ───────────────────────────────────────────────────────────
function OperatorsTab() {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(null);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState({});
  const [saving, setSaving]       = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    billingAPI.getOperators()
      .then(r => setOperators(r.data.operators || []))
      .catch(() => toast.error('Failed'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (op) => {
    setEditing(op.provider.id);
    setForm({
      settlementCycle:  op.balance?.settlementCycle  || '',
      commissionRate:   op.balance?.commissionRate   || '',
      minimumThreshold: op.balance?.minimumThreshold || '',
      payoutDay:        op.balance?.payoutDay        ?? '',
      bankDetails:      JSON.stringify(op.balance?.bankDetails || {}, null, 2),
      notes:            op.balance?.notes            || '',
    });
  };

  const saveEdit = async (providerId) => {
    setSaving(true);
    try {
      const payload = { ...form };
      try { payload.bankDetails = JSON.parse(form.bankDetails); } catch { delete payload.bankDetails; }
      await billingAPI.updateOperatorSettings(providerId, payload);
      toast.success('Settings saved');
      setEditing(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const generateBatch = async (providerId) => {
    const periodEnd   = new Date(); periodEnd.setDate(periodEnd.getDate() - 1);
    const periodStart = new Date(); periodStart.setDate(periodStart.getDate() - 7);
    const body = {
      providerId,
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd:   periodEnd.toISOString().split('T')[0],
    };
    try {
      const r = await billingAPI.generateBatch(body);
      toast.success(`Batch ${r.data.batch.batchNumber} created`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-3">
      {operators.map(({ provider: p, balance: b }) => (
        <div key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
            <div className="w-10 h-10 bg-nepal-blue rounded-xl flex items-center justify-center text-white font-bold shrink-0">
              {(p.companyName || p.name)?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800">{p.companyName || p.name}</p>
              <p className="text-xs text-gray-400">{p.email}</p>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="text-center"><p className="font-bold text-yellow-600">{fmt(b?.pendingBalance)}</p><p className="text-xs text-gray-400">Pending</p></div>
              <div className="text-center"><p className="font-bold text-blue-600">{fmt(b?.heldBalance)}</p><p className="text-xs text-gray-400">Held</p></div>
              <div className="text-center"><p className="font-bold text-green-600">{fmt(b?.totalPaid)}</p><p className="text-xs text-gray-400">Total Paid</p></div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); generateBatch(p.id); }}
                className="text-xs px-2.5 py-1 bg-nepal-blue text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
                <Plus className="h-3 w-3" /> Batch
              </button>
              {expanded === p.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </div>
          </div>

          {expanded === p.id && (
            <div className="border-t border-gray-100 p-4">
              {editing === p.id ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'settlementCycle', label: 'Cycle', type: 'select', options: [['', 'Use global'], ['weekly', 'Weekly'], ['monthly', 'Monthly']] },
                    { key: 'commissionRate',   label: 'Commission %', type: 'number' },
                    { key: 'minimumThreshold', label: 'Min Threshold (NPR)', type: 'number' },
                    { key: 'payoutDay',        label: 'Payout Day (0=Sun/1=Mon)', type: 'number' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="label text-xs">{f.label}</label>
                      {f.type === 'select'
                        ? <select value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="input-field text-sm py-1.5">
                            {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        : <input type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="input-field text-sm py-1.5" />
                      }
                    </div>
                  ))}
                  <div className="col-span-2 md:col-span-3">
                    <label className="label text-xs">Bank Details (JSON)</label>
                    <textarea rows={3} value={form.bankDetails} onChange={e => setForm({ ...form, bankDetails: e.target.value })} className="input-field text-xs font-mono" />
                  </div>
                  <div className="col-span-2 md:col-span-3 flex gap-2">
                    <button onClick={() => saveEdit(p.id)} disabled={saving} className="btn-primary text-sm py-1.5 px-4">{saving ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => setEditing(null)} className="py-1.5 px-4 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 text-sm">
                  <div><span className="text-gray-400">Cycle:</span> <span className="font-medium">{b?.settlementCycle || 'global default'}</span></div>
                  <div><span className="text-gray-400">Commission:</span> <span className="font-medium">{b?.commissionRate != null ? `${b.commissionRate}%` : 'global default'}</span></div>
                  <div><span className="text-gray-400">Min threshold:</span> <span className="font-medium">{b?.minimumThreshold != null ? fmt(b.minimumThreshold) : 'global default'}</span></div>
                  <div><span className="text-gray-400">Next payout:</span> <span className="font-medium">{b?.nextPayoutDate || '—'}</span></div>
                  {b?.bankDetails?.accountNumber && (
                    <div><span className="text-gray-400">Account:</span> <span className="font-medium">{b.bankDetails.accountNumber}</span></div>
                  )}
                  <button onClick={() => startEdit({ provider: p, balance: b })}
                    className="ml-auto text-xs px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1">
                    <Settings className="h-3 w-3" /> Edit Settings
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      {operators.length === 0 && <div className="text-center py-16 text-gray-400">No providers registered yet</div>}
    </div>
  );
}

// ─── TAB: Transactions ────────────────────────────────────────────────────────
function TransactionsTab() {
  const [txs, setTxs]       = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', providerId: '', from: '', to: '', page: 1 });

  const load = useCallback(() => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
    billingAPI.getTransactions(params)
      .then(r => { setTxs(r.data.transactions || []); setTotal(r.data.total || 0); })
      .catch(() => toast.error('Failed'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
        {[
          { key: 'status', label: 'Status', type: 'select', options: [['', 'All'], ['pending','Pending'], ['held','Held'], ['released','Released'], ['paid','Paid'], ['refunded','Refunded']] },
          { key: 'from',   label: 'From', type: 'date' },
          { key: 'to',     label: 'To',   type: 'date' },
        ].map(f => (
          <div key={f.key}>
            <label className="label text-xs">{f.label}</label>
            {f.type === 'select'
              ? <select value={filters[f.key]} onChange={e => setFilters({ ...filters, [f.key]: e.target.value, page: 1 })} className="input-field py-1.5 text-sm">
                  {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              : <input type={f.type} value={filters[f.key]} onChange={e => setFilters({ ...filters, [f.key]: e.target.value, page: 1 })} className="input-field py-1.5 text-sm" />
            }
          </div>
        ))}
        <button onClick={() => setFilters({ status: '', providerId: '', from: '', to: '', page: 1 })} className="py-1.5 px-3 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Clear</button>
        <span className="ml-auto text-xs text-gray-400 self-end">{total} records</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-500 border-t-transparent" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['Ticket #', 'Customer', 'Phone', 'Operator', 'Trip Date', 'Gross', 'Comm', 'Net', 'Status', 'Created'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {txs.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{t.booking?.ticketNumber || t.bookingId?.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-xs font-medium">{t.booking?.customer?.name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{t.booking?.customer?.phoneNumber || '—'}</td>
                    <td className="px-4 py-3 text-xs">{t.provider?.companyName || t.provider?.name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{t.tripDate}</td>
                    <td className="px-4 py-3 text-xs">{fmt(t.grossAmount)}</td>
                    <td className="px-4 py-3 text-xs text-red-500">-{fmt(t.commissionAmount)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-green-700">{fmt(t.netAmount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {txs.length === 0 && (
                  <tr><td colSpan="10" className="text-center py-16 text-gray-400">No transactions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TAB: Payouts ─────────────────────────────────────────────────────────────
function PayoutsTab() {
  const [batches, setBatches] = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [genModal, setGenModal] = useState(false);
  const [genForm, setGenForm]   = useState({ providerId: '', periodStart: '', periodEnd: '' });
  const [providers, setProviders] = useState([]);

  const load = useCallback(() => {
    setLoading(true);
    const params = statusFilter ? { status: statusFilter } : {};
    billingAPI.getBatches(params)
      .then(r => { setBatches(r.data.batches || []); setTotal(r.data.total || 0); })
      .catch(() => toast.error('Failed'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    billingAPI.getOperators().then(r => setProviders(r.data.operators || [])).catch(() => {});
  }, []);

  const generateBatch = async () => {
    try {
      const r = await billingAPI.generateBatch(genForm);
      toast.success(`Batch ${r.data.batch.batchNumber} created`);
      setGenModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to generate batch'); }
  };

  const quickAction = async (batchId, action, extra = {}) => {
    try {
      if (action === 'approve') await billingAPI.approveBatch(batchId);
      if (action === 'reject') {
        const reason = prompt('Rejection reason:');
        if (!reason) return;
        await billingAPI.rejectBatch(batchId, { reason });
      }
      if (action === 'mark-paid') {
        const payoutReference = prompt('Payout reference (bank transfer ID / cheque #):');
        if (!payoutReference) return;
        await billingAPI.markBatchPaid(batchId, { payoutMethod: 'bank_transfer', payoutReference });
      }
      toast.success('Done');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field py-1.5 text-sm w-44">
          {[['', 'All Statuses'], ['pending_approval','Pending Approval'], ['approved','Approved'], ['paid','Paid'], ['rejected','Rejected']].map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400">{total} batches</span>
        <button onClick={() => setGenModal(true)}
          className="ml-auto btn-primary text-sm py-2 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Generate Batch
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-500 border-t-transparent" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['Batch #', 'Operator', 'Period', 'Txns', 'Gross', 'Commission', 'Net Payable', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {batches.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{b.batchNumber}</td>
                    <td className="px-4 py-3 text-xs font-medium">{b.provider?.companyName || b.provider?.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{b.periodStart} → {b.periodEnd}</td>
                    <td className="px-4 py-3 text-center">{b.transactionCount}</td>
                    <td className="px-4 py-3 text-xs">{fmt(b.totalGross)}</td>
                    <td className="px-4 py-3 text-xs text-red-500">-{fmt(b.totalCommission)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-green-700">{fmt(b.totalNet)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Link to={`/admin/billing/batches/${b.id}`} className="p-1.5 text-gray-400 hover:text-nepal-blue hover:bg-blue-50 rounded-lg" title="View"><Eye className="h-4 w-4" /></Link>
                        {['draft', 'pending_approval'].includes(b.status) && (
                          <button onClick={() => quickAction(b.id, 'approve')} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Approve"><CheckCircle className="h-4 w-4" /></button>
                        )}
                        {b.status === 'approved' && (
                          <button onClick={() => quickAction(b.id, 'mark-paid')} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Mark Paid"><DollarSign className="h-4 w-4" /></button>
                        )}
                        {['draft', 'pending_approval', 'approved'].includes(b.status) && (
                          <button onClick={() => quickAction(b.id, 'reject')} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Reject"><XCircle className="h-4 w-4" /></button>
                        )}
                        <button onClick={async () => {
                          try {
                            const r = await billingAPI.exportBatchCSV(b.id);
                            const url = window.URL.createObjectURL(new Blob([r.data]));
                            const a = document.createElement('a');
                            a.href = url; a.download = `batch-${b.batchNumber}.csv`; a.click();
                            window.URL.revokeObjectURL(url);
                          } catch { toast.error('Export failed'); }
                        }} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Export CSV"><Download className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {batches.length === 0 && (
                  <tr><td colSpan="9" className="text-center py-16 text-gray-400">No payout batches yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Batch Modal */}
      {genModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus className="h-5 w-5 text-nepal-blue" /> Generate Payout Batch</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Operator *</label>
                <select value={genForm.providerId} onChange={e => setGenForm({ ...genForm, providerId: e.target.value })} className="input-field" required>
                  <option value="">Select operator...</option>
                  {providers.map(({ provider: p }) => <option key={p.id} value={p.id}>{p.companyName || p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Period Start *</label>
                  <input type="date" value={genForm.periodStart} onChange={e => setGenForm({ ...genForm, periodStart: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="label">Period End *</label>
                  <input type="date" value={genForm.periodEnd} onChange={e => setGenForm({ ...genForm, periodEnd: e.target.value })} className="input-field" required />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setGenModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={generateBatch} className="flex-1 btn-primary">Generate</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB: Settings ────────────────────────────────────────────────────────────
function SettingsTab() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    billingAPI.getSettings().then(r => setSettings(r.data.settings)).catch(() => toast.error('Failed'));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await billingAPI.updateSettings(settings);
      setSettings(r.data.settings);
      toast.success('Settings saved');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  if (!settings) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-500 border-t-transparent" /></div>;

  const fields = [
    { key: 'commissionRate',   label: 'Default Commission Rate (%)',   type: 'number', note: 'Platform fee taken from each booking. Can override per operator.' },
    { key: 'settlementCycle',  label: 'Default Settlement Cycle',       type: 'select', options: [['weekly','Weekly'],['monthly','Monthly']] },
    { key: 'payoutDay',        label: 'Default Payout Day',             type: 'number', note: 'Weekly: 0=Sun, 1=Mon…6=Sat. Monthly: 1–28 (day of month).' },
    { key: 'minimumThreshold', label: 'Minimum Payout Threshold (NPR)', type: 'number', note: 'Batches smaller than this amount are skipped until next cycle.' },
    { key: 'autoApprove',      label: 'Auto-approve Batches',           type: 'select', options: [['false','No — require manual approval'],['true','Yes — auto-approve on generation']] },
  ];

  return (
    <div className="max-w-xl bg-white rounded-2xl shadow-sm p-6 space-y-5">
      <h3 className="font-bold text-gray-800 flex items-center gap-2"><Settings className="h-5 w-5 text-nepal-blue" /> Global Billing Settings</h3>
      <p className="text-sm text-gray-500">These are the platform defaults. Individual operators can override these in the Operators tab.</p>
      {fields.map(f => (
        <div key={f.key}>
          <label className="label">{f.label}</label>
          {f.type === 'select'
            ? <select value={settings[f.key] || ''} onChange={e => setSettings({ ...settings, [f.key]: e.target.value })} className="input-field">
                {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            : <input type={f.type} value={settings[f.key] || ''} onChange={e => setSettings({ ...settings, [f.key]: e.target.value })} className="input-field" />
          }
          {f.note && <p className="text-xs text-gray-400 mt-1">{f.note}</p>}
        </div>
      ))}
      <button onClick={save} disabled={saving} className="btn-primary w-full">{saving ? 'Saving...' : 'Save Settings'}</button>
    </div>
  );
}

// ─── Main Billing Page ────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard',    label: 'Dashboard',    icon: BarChart2   },
  { id: 'operators',    label: 'Operators',    icon: Users       },
  { id: 'transactions', label: 'Transactions', icon: DollarSign  },
  { id: 'payouts',      label: 'Payouts',      icon: Banknote    },
  { id: 'settings',     label: 'Settings',     icon: Settings    },
];

export default function AdminBilling() {
  const [tab, setTab] = useState('dashboard');

  return (
    <AdminLayout title="Billing & Payouts">
      {/* Tab bar */}
      <div className="flex gap-1 bg-white rounded-2xl shadow-sm p-1.5 mb-6 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              tab === id ? 'bg-nepal-blue text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'dashboard'    && <DashboardTab />}
      {tab === 'operators'    && <OperatorsTab />}
      {tab === 'transactions' && <TransactionsTab />}
      {tab === 'payouts'      && <PayoutsTab />}
      {tab === 'settings'     && <SettingsTab />}
    </AdminLayout>
  );
}
