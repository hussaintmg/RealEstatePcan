'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface DirectUploaderProps {
  onUploadComplete: (url: string) => void;
  accept?: string;
  label?: string;
  folder?: string;
}

export const DirectUploader: React.FC<DirectUploaderProps> = ({
  onUploadComplete,
  accept = '*/*',
  label = 'Upload Asset (3D Model / Video / Image)',
  folder = 'properties',
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(10);
    setError(null);

    try {
      // 1. Fetch active storage configuration
      const configRes = await fetch('/api/storage/config');
      const configData = await configRes.json();

      if (!configData.success) {
        throw new Error(configData.error || 'Failed to fetch storage config');
      }

      setProgress(30);

      if (configData.storageProvider === 'supabase' && configData.supabase?.url && configData.supabase?.anonKey) {
        // Direct client-to-Supabase upload (Bufferless)
        const supabase = createClient(configData.supabase.url, configData.supabase.anonKey);
        const fileName = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        setProgress(50);
        const { error: uploadError } = await supabase.storage
          .from(configData.supabase.bucket)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        setProgress(90);
        const { data: publicData } = supabase.storage
          .from(configData.supabase.bucket)
          .getPublicUrl(fileName);

        setUploadedUrl(publicData.publicUrl);
        onUploadComplete(publicData.publicUrl);
      } else {
        // Fallback to local uploads
        const formData = new FormData();
        formData.append('file', file);

        setProgress(50);
        const localRes = await fetch('/api/storage/local-upload', {
          method: 'POST',
          body: formData,
        });

        const localData = await localRes.json();
        if (!localData.success) throw new Error(localData.error || 'Local upload failed');

        setProgress(90);
        setUploadedUrl(localData.url);
        onUploadComplete(localData.url);
      }

      setProgress(100);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full border-2 border-dashed border-white/10 hover:border-blue-500/40 rounded-xl p-6 transition-all text-center bg-white/[0.02]">
      <label className="cursor-pointer flex flex-col items-center justify-center space-y-2">
        {uploading ? (
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        ) : uploadedUrl ? (
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        ) : (
          <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-blue-400" />
        )}

        <span className="text-sm font-medium text-slate-200">{label}</span>
        <span className="text-xs text-slate-400">Click or drag & drop files here</span>

        <input
          type="file"
          accept={accept}
          className="hidden"
          disabled={uploading}
          onChange={handleFileChange}
        />
      </label>

      {uploading && (
        <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-blue-500 h-1.5 transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {uploadedUrl && (
        <p className="mt-2 text-xs text-emerald-400 truncate max-w-full">Uploaded: {uploadedUrl}</p>
      )}

      {error && (
        <div className="mt-2 flex items-center justify-center space-x-1 text-xs text-rose-400">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
