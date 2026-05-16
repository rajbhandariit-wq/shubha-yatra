import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, FileText, Image, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import ProviderLayout from '../../components/ProviderLayout';
import { providerAPI } from '../../services/api';
import toast from 'react-hot-toast';

const REQUIRED_DOCS = [
  { key: 'company_reg', label: 'Company Registration Certificate' },
  { key: 'pan_vat', label: 'PAN / VAT Certificate' },
  { key: 'govt_id', label: 'Owner Government-issued ID' },
  { key: 'vehicle_reg', label: 'Vehicle Registration Papers' },
];

function FileIcon({ mimetype }) {
  if (mimetype?.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
  return <FileText className="h-5 w-5 text-red-500" />;
}

export default function ProviderDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState('');
  const fileRef = useRef();

  const load = () => {
    setLoading(true);
    providerAPI.getDocuments()
      .then(r => setDocuments(r.data.documents || []))
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files[0];
    if (!file) return toast.error('Please select a file');
    if (!label) return toast.error('Please select a document type');

    const formData = new FormData();
    formData.append('document', file);
    formData.append('label', label);

    setUploading(true);
    try {
      await providerAPI.uploadDocument(formData);
      toast.success('Document uploaded successfully');
      setLabel('');
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename, name) => {
    if (!confirm(`Remove "${name}"?`)) return;
    try {
      await providerAPI.deleteDocument(filename);
      toast.success('Document removed');
      load();
    } catch { toast.error('Failed to remove document'); }
  };

  const uploadedLabels = documents.map(d => d.label || '');

  return (
    <ProviderLayout title="Documents">
      <div className="max-w-3xl space-y-6">

        {/* Required documents checklist */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" /> Required Documents
          </h3>
          <div className="space-y-2">
            {REQUIRED_DOCS.map(doc => {
              const uploaded = uploadedLabels.includes(doc.key);
              return (
                <div key={doc.key} className={`flex items-center gap-3 p-3 rounded-xl ${uploaded ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  {uploaded
                    ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    : <Clock className="h-5 w-5 text-yellow-500 shrink-0" />}
                  <span className={`text-sm font-medium ${uploaded ? 'text-green-700' : 'text-yellow-700'}`}>{doc.label}</span>
                  {!uploaded && <span className="ml-auto text-xs text-yellow-500">Pending</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upload form */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-nepal-blue" /> Upload Document
          </h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="label">Document Type *</label>
              <select value={label} onChange={e => setLabel(e.target.value)} className="input-field" required>
                <option value="">Select document type...</option>
                {REQUIRED_DOCS.map(d => (
                  <option key={d.key} value={d.key}>{d.label}</option>
                ))}
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">File * <span className="text-gray-400 font-normal">(JPG, PNG or PDF · max 5 MB)</span></label>
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="input-field file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-nepal-blue file:text-white hover:file:bg-blue-700" required />
            </div>
            <button type="submit" disabled={uploading} className="btn-primary flex items-center gap-2">
              {uploading ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Uploading...</> : <><Upload className="h-4 w-4" /> Upload Document</>}
            </button>
          </form>
        </div>

        {/* Uploaded documents list */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">Uploaded Documents ({documents.length})</h3>
          {loading ? (
            <div className="flex items-center justify-center h-24"><div className="animate-spin rounded-full h-8 w-8 border-4 border-nepal-blue border-t-transparent" /></div>
          ) : documents.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 text-gray-200" />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, i) => {
                const docLabel = REQUIRED_DOCS.find(d => d.key === doc.label)?.label || doc.label || doc.originalName;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FileIcon mimetype={doc.mimetype} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{docLabel}</p>
                      <p className="text-xs text-gray-400">{doc.originalName} · {(doc.size / 1024).toFixed(0)} KB · {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    </div>
                    <a href={`/api/uploads/documents/${doc.filename}`} target="_blank" rel="noreferrer" className="text-xs text-nepal-blue hover:underline shrink-0">View</a>
                    <button onClick={() => handleDelete(doc.filename, docLabel)} className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition-colors shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProviderLayout>
  );
}
