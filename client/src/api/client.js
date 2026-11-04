import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('airvoice-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function downloadBill(id, format = 'pdf', setLoading, setError) {
  if (setLoading) setLoading(format);
  if (setError) setError('');
  try {
    const isExcel = format === 'xls' || format === 'xlsx';
    const ext = isExcel ? 'xlsx' : format === 'csv' ? 'csv' : 'pdf';
    const mime = isExcel
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : format === 'csv'
      ? 'text/csv'
      : 'application/pdf';

    const res = await api.get(`/bills/${id}/download?format=${format}`, {
      responseType: 'blob'
    });
    const blob = new Blob([res.data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const disposition = res.headers ? (res.headers['content-disposition'] || res.headers['Content-Disposition']) : null;
    const match = disposition ? /filename="?([^"]+)"?/.exec(disposition) : null;
    a.download = match ? match[1] : `AirVoice-bill-${id}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    if (setError) setError('Unable to download your statement. Please try again.');
  } finally {
    if (setLoading) setLoading(false);
  }
}

export default api;

