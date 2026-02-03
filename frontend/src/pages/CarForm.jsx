import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { ArrowLeft, X, Image as ImageIcon } from 'lucide-react';

export default function CarForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({
    plate_number: '', make: '', model: '', year: new Date().getFullYear(), class: 'Sedan',
    branch_id: '', status: 'active', base_daily_rate: 50, vin: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api('/api/branches').then(setBranches).catch(() => { });
    if (isEdit) {
      api(`/api/cars/${id}`).then((car) => {
        setForm({
          plate_number: car.plate_number,
          make: car.make,
          model: car.model,
          year: car.year,
          class: car.class,
          branch_id: car.branch_id ?? '',
          status: car.status,
          base_daily_rate: car.base_daily_rate,
          vin: car.vin ?? '',
          notes: car.notes ?? '',
        });
        if (car.images) setImages(car.images);
      }).catch((e) => setError(e.message));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const payload = {
      ...form,
      year: Number(form.year),
      base_daily_rate: Number(form.base_daily_rate),
      branch_id: form.branch_id ? Number(form.branch_id) : null,
      vin: form.vin || null,
      notes: form.notes || null,
    };

    try {
      const res = isEdit
        ? await api(`/api/cars/${id}`, { method: 'PUT', body: payload })
        : await api('/api/cars', { method: 'POST', body: payload });

      const carId = isEdit ? id : res.id;

      // Handle Image Upload if any new files are selected (not implemented via state here yet, purely separate step for simplicity or need to augment)
      // Actually, let's allow uploading directly from the UI *after* save or *during* edit. 
      // For creation, we redirect to edit to add images or handle it here?
      // Let's redirect to edit view if created, or just back to list.
      // If user added images in the specialized upload section (which we will add below), they are uploaded immediately.

      navigate('/cars');
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    if (!e.target.files.length) return;
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append('images', e.target.files[i]);
    }

    setUploading(true);
    try {
      // We need to use fetch directly or update client to handle formData
      // Using direct fetch for multipart/form-data to let browser set boundary
      const token = localStorage.getItem('rental_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/cars/${id}/images`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }, // Don't set Content-Type
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload images');

      // Refresh car data to show new images
      const car = await api(`/api/cars/${id}`);
      setImages(car.images || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
      e.target.value = null; // Reset input
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/cars">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plate Number *</Label>
                <Input required value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} disabled={isEdit} />
              </div>
              <div className="space-y-2">
                <Label>VIN</Label>
                <Input value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Make *</Label>
                <Input required value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Model *</Label>
                <Input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Year *</Label>
                <Input type="number" required value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} min="1990" max="2030" />
              </div>
              <div className="space-y-2">
                <Label>Class *</Label>
                <Input value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} placeholder="Sedan, SUV..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
                  <option value="">— Select Branch —</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Base Daily Rate ($) *</Label>
              <Input type="number" required value={form.base_daily_rate} onChange={(e) => setForm({ ...form, base_daily_rate: e.target.value })} min="0" step="0.01" />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea
                className="flex h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Link to="/cars">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {isEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {images.map((img) => (
                <div key={img.id} className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
                  <img src={`${import.meta.env.VITE_API_URL || ''}${img.url_path}`} alt="Car" className="w-full h-full object-cover" />
                </div>
              ))}
              <div className="aspect-video bg-muted rounded-lg border flex items-center justify-center relative cursor-pointer hover:bg-muted/80 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  {uploading ? <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /> : <ImageIcon className="h-8 w-8" />}
                  <span className="text-xs font-medium">{uploading ? 'Uploading...' : 'Upload Images'}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Tip: Upload horizontal images for best results.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

