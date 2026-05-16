import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, CheckCircle, XCircle, DollarSign,
  Clock, Calendar, User, Hash, FileText, AlertTriangle,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { billingAPI } from '../../services/api';
import toast from 'react-hot-toast';

const fmt = (n) => `NPR ${parseFloat(n || 0).toLocaleString('en-NP', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-NP') : '—';

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
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 w-40">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right">{value || '—'}</span>
    </div>
  );
}

export default function BatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [payRef, setPayRef] = useState('');
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  const load = () => {
    setLoading(true);
    billingAPI.getBatchDetail(id)
      .then(r => setBatch(r.data))
      .catch(() => toast.error('Failed to load batch'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await billingAPI.approveBatch(id);
      toast.success('Batch approved');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to approve'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Rejection reason is required'); return; }
    setActionLoading(true);
    try {
      await billingAPI.rejectBatch(id, { reason: rejectReason });
      toast.success('Batch rejected');
      setShowRejectModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to reject'); }
    finally { setActionLoading(false); }
  };

  const handleMarkPaid = async () => {
    if (!payRef.trim()) { toast.error('Payment reference is required'); return; }
    setActionLoading(true);
    try {
      await billingAPI.markBatchPaid(id, { payoutReference: payRef, payoutMethod: payMethod });
      toast.success('Batch marked as paid');
      setShowPayModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to mark paid'); }
    finally { setActionLoading(false); }
  };

  const handleExport = async () => {
    try {
      const r = await billingAPI.exportBatchCSV(id);
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-${batch?.batchNumber || id}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('CSV export failed'); }
  };

  if (loading) return (
    <AdminLayout title="Batch Detail">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-500 border-t-transparent" />
      </div>
    </AdminLayout>
  );

  if (!batch) return (
    <AdminLayout title="Batch Detail">
      <div className="text-center py-16 text-gray-500">Batch not found.</div>
    </AdminLayout>
  );

  const b = batch.batch || batch;
  const txns = batch.transactions || [];
  const logs = b.auditLog || [];

  const canApprove = b.status === 'pending_approval';
  const canReject = ['pending_approval', 'approved'].includes(b.status);
  const canMarkPaid = b.status === 'approved';

  return (
    <AdminLayout title={`Batch ${b.batchNumber}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button onClick={() => navigate('/admin/billing')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Billing
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-1.5 text-sm">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          {canApprove && (
            <button onClick={handleApprove} disabled={actionLoading} className="btn-primary flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4" /> Approve
            </button>
          )}
          {canMarkPaid && (
            <button onClick={() => setShowPayModal(true)} disabled={actionLoading} className="btn-primary flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700">
              <DollarSign className="h-4 w-4" /> Mark Paid
            </button>
          )}
          {canReject && (
            <button onClick={() => setShowRejectModal(true)} disabled={actionLoading} className="btn-primary flex items-center gap-1.5 text-sm bg-red-600 hover:bg-red-700">
              <XCircle className="h-4 w-4" /> Reject
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Batch info */}
        <div className="lg:col-span-1 space-y-5">
          {/* Summary card */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">Batch Summary</h2>
              <StatusBadge status={b.status} />
            </div>
            <div className="space-y-1">
              <InfoRow label="Batch #" value={b.batchNumber} />
              <InfoRow label="Operator" value={b.provider?.companyName || b.provider?.name} />
              <InfoRow label="Period" value={`${fmtDate(b.periodStart)} – ${fmtDate(b.periodEnd)}`} />
              <InfoRow label="Transactions" value={`${b.transactionCount || txns.length}`} />
              <InfoRow label="Gross Amount" value={fmt(b.totalGross)} />
              <InfoRow label="Commission" value={fmt(b.totalCommission)} />
              <InfoRow label="Net Payable" value={<span className="text-green-700 font-bold">{fmt(b.totalNet)}</span>} />
            </div>
          </div>

          {/* Payment info */}
          {(b.status === 'paid' || b.payoutReference) && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-700 mb-4">Payment Details</h2>
              <div className="space-y-1">
                <InfoRow label="Method" value={b.payoutMethod?.replace(/_/g, ' ')} />
                <InfoRow label="Reference" value={b.payoutReference} />
                <InfoRow label="Paid At" value={fmtDateTime(b.paidAt)} />
              </div>
            </div>
          )}

          {/* Rejection info */}
          {b.status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold text-sm">Rejected</span>
              </div>
              <p className="text-sm text-red-600">{b.rejectedReason || 'No reason provided'}</p>
              <p className="text-xs text-red-400 mt-1">{fmtDateTime(b.rejectedAt)}</p>
            </div>
          )}

          {/* Audit log */}
          {logs.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-700 mb-3">Audit Log</h2>
              <ol className="space-y-3">
                {[...logs].reverse().map((log, i) => (
                  <li key={i} className="text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-700 capitalize">{log.action?.replace(/_/g, ' ')}</p>
                        {log.note && <p className="text-gray-500">{log.note}</p>}
                        <p className="text-gray-400">{fmtDateTime(log.at)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Right: Transactions table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-700">Transactions ({txns.length})</h2>
            </div>
            {txns.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">No transactions in this batch.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Booking</th>
                      <th className="px-4 py-3 text-left">Trip Date</th>
                      <th className="px-4 py-3 text-right">Gross</th>
                      <th className="px-4 py-3 text-right">Commission</th>
                      <th className="px-4 py-3 text-right">Net</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {txns.map(tx => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{tx.booking?.ticketNumber || `#${tx.bookingId?.slice(0, 8)}`}</div>
                          {tx.booking?.customer && (
                            <div className="text-xs text-gray-400">{tx.booking.customer.name}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{fmtDate(tx.tripDate)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{fmt(tx.grossAmount)}</td>
                        <td className="px-4 py-3 text-right text-red-600">−{fmt(tx.commissionAmount)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-700">{fmt(tx.netAmount)}</td>
                        <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold text-sm">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-gray-600">Total</td>
                      <td className="px-4 py-3 text-right text-gray-800">{fmt(b.totalGross)}</td>
                      <td className="px-4 py-3 text-right text-red-600">−{fmt(b.totalCommission)}</td>
                      <td className="px-4 py-3 text-right text-green-700">{fmt(b.totalNet)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Reject Batch</h3>
            <p className="text-sm text-gray-500 mb-3">Provide a reason for rejecting this payout batch.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-300 focus:outline-none"
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowRejectModal(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleReject} disabled={actionLoading} className="btn-primary bg-red-600 hover:bg-red-700 text-sm">
                {actionLoading ? 'Rejecting...' : 'Reject Batch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Mark Batch as Paid</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payout Method</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="esewa">eSewa</option>
                  <option value="khalti">Khalti</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference *</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  placeholder="Transaction ID / Cheque No / Reference"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
                />
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-700">Net amount to pay: <span className="font-bold">{fmt(b.totalNet)}</span></p>
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowPayModal(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleMarkPaid} disabled={actionLoading} className="btn-primary bg-blue-600 hover:bg-blue-700 text-sm">
                {actionLoading ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
