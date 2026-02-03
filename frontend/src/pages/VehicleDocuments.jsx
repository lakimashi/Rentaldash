import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function VehicleDocuments() {
  const { id } = useParams();
  const [documents, setDocuments] = useState([]);
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ document_type: 'registration', title: '', expiry_date: '' });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  useEffect(() => {
    Promise.all([fetchDocuments(), fetchCar()]);
  }, []);

  const fetchDocuments = async () => {
    api(`/api/cars/${id}/documents`)
      .then(setDocuments)
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  };

  const fetchCar = async () => {
    api(`/api/cars/${id}`)
      .then(setCar)
      .catch(() => {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData();
    formData.append('document', e.target.file.files[0]);
    formData.append('document_type', form.document_type);
    formData.append('title', form.title);
    if (form.expiry_date) formData.append('expiry_date', form.expiry_date);

    try {
      const token = localStorage.getItem('rental_token');
      const res = await fetch(`/api/cars/${id}/documents`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      setForm({ document_type: 'registration', title: '', expiry_date: '' });
      setShowForm(false);
      fetchDocuments();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (docId, urlPath) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api(`/api/cars/documents/${docId}`, { method: 'DELETE' });
      setDocuments(documents.filter((d) => d.id !== docId));
    } catch (err) {
      alert(err.message);
    }
  };

  const getExpiryWarning = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30) return { daysLeft, color: 'text-red-600 bg-red-50' };
    if (daysLeft <= 60) return { daysLeft, color: 'text-yellow-600 bg-yellow-50' };
    return { daysLeft, color: 'text-green-600 bg-green-50' };
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!car) return <div className="text-red-600">Vehicle not found</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Vehicle Documents</h1>
          <p className="text-gray-600">{car.plate_number} – {car.make} {car.model}</p>
        </div>
        <Link to="/cars" className="text-sm text-gray-600 hover:underline">Back to Cars</Link>
      </div>

      {canEdit && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <button type="button" onClick={() => setShowForm(!showForm)} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700">
            {showForm ? 'Cancel' : 'Upload Document'}
          </button>

          {showForm && (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                <select required value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2">
                  <option value="registration">Registration</option>
                  <option value="insurance">Insurance</option>
                  <option value="inspection">Inspection</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="e.g., Registration 2025" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                <input required type="file" name="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full border border-gray-300 rounded px-3 py-2" />
                <p className="text-xs text-gray-500 mt-1">Max file size: 10MB. Formats: PDF, JPG, PNG</p>
              </div>
              <button type="submit" disabled={submitting} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50">
                {submitting ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          )}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          No documents yet. {canEdit && 'Upload one above.'}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Title</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Expiry Date</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Uploaded</th>
                {canEdit && <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {documents.map((doc) => {
                const warning = getExpiryWarning(doc.expiry_date);
                return (
                  <tr key={doc.id}>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 uppercase">
                        {doc.document_type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">{doc.title}</td>
                    <td className="px-4 py-2">
                      {warning ? (
                        <span className={`px-2 py-0.5 rounded text-xs ${warning.color}`}>
                          {doc.expiry_date} ({warning.daysLeft} days left)
                        </span>
                      ) : (
                        <span className="text-sm text-gray-600">{doc.expiry_date || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">{new Date(doc.created_at).toLocaleDateString()}</td>
                    {canEdit && (
                      <td className="px-4 py-2 text-right">
                        <a href={doc.url_path} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mr-3">
                          Download
                        </a>
                        <button onClick={() => handleDelete(doc.id, doc.url_path)} className="text-sm text-red-600 hover:underline">
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
