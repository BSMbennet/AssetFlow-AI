'use client';

import { useEffect, useState } from 'react';
import { FileText, Loader2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export type AssetDocument = {
  id: string;
  name: string;
  file_type: string | null;
  file_size: number | null;
  document_type: string | null;
  status: string;
  created_at: string;
};

type Props = {
  assetId: string;
  onClose: () => void;
};

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export function AssetDocuments({ assetId, onClose }: Props) {
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function loadDocuments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('id,name,file_type,file_size,document_type,status,created_at')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setDocuments((data as AssetDocument[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadDocuments();
  }, [assetId]);

  async function handleUpload(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Files must be 100 MB or smaller.');
      return;
    }

    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('You must be signed in.');

      const extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
      const storagePath = `${assetId}/${crypto.randomUUID()}.${extension}`;

      const { error: storageError } = await supabase.storage
        .from('asset-documents')
        .upload(storagePath, file, { contentType: file.type || 'application/octet-stream', upsert: false });
      if (storageError) throw storageError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single();
      if (profileError || !profile?.organization_id) throw new Error('Your account is not linked to an organization.');

      const { error: documentError } = await supabase.from('documents').insert({
        asset_id: assetId,
        organization_id: profile.organization_id,
        name: file.name,
        storage_path: storagePath,
        file_type: file.type || extension,
        file_size: file.size,
        status: 'UPLOADED',
        uploaded_by: userData.user.id,
      });
      if (documentError) {
        await supabase.storage.from('asset-documents').remove([storagePath]);
        throw documentError;
      }

      toast.success('Document uploaded');
      await loadDocuments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function formatSize(size: number | null) {
    if (!size) return '—';
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-6">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">Asset documents</h2>
            <p className="mt-1 text-sm text-gray-500">Upload source documents for AI asset intelligence.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-10 text-center hover:border-primary dark:border-gray-600">
          {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-gray-400" />}
          <span className="mt-3 font-medium">{uploading ? 'Uploading…' : 'Choose a document'}</span>
          <span className="mt-1 text-sm text-gray-500">PDF, DOCX, XLSX, JPG or PNG · up to 100 MB</span>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleUpload(file);
              event.currentTarget.value = '';
            }}
          />
        </label>

        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading documents…</div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No documents uploaded yet.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {documents.map((document) => (
                <div key={document.id} className="flex items-center gap-4 p-4">
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{document.name}</p>
                    <p className="text-xs text-gray-500">{formatSize(document.file_size)} · {document.status}</p>
                  </div>
                  <span className="text-xs text-gray-500">{document.document_type ?? 'Unclassified'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
