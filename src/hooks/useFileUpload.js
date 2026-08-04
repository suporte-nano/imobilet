import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { FileText, Image as ImageIcon, File, FileSpreadsheet } from 'lucide-react';
import { sanitizeFileName } from '@/lib/sanitizeFileName';

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  const validateFileName = (name) => {
    // We can be more lenient here because we will sanitize it anyway before upload.
    // We just reject completely broken names.
    if (!name || name.trim() === '') return false;
    return true;
  };

  const uploadFile = async (file, bucket, path) => {
    setIsUploading(true);
    try {
      if (!validateFileName(file.name)) {
        throw new Error(`O nome do arquivo é inválido. Renomeie e tente novamente.`);
      }

      // Use the utility to remove accents and invalid characters
      const cleanName = sanitizeFileName(file.name);
      const fileName = `${Date.now()}-${cleanName}`;
      const fullPath = `${path}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false
      });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fullPath);
      
      // Return jsonb-compatible structure with original_name preserved with all accents for UI display
      return {
        original_name: file.name,
        url: data.publicUrl,
        file_type: file.type,
        size: file.size,
        uploaded_at: new Date().toISOString()
      };
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (bucket, url) => {
    if (!url) return;
    try {
      const urlParts = url.split(`/public/${bucket}/`);
      if (urlParts.length === 2) {
        // Decode URI component in case the stored URL has encoded characters
        const path = decodeURIComponent(urlParts[1]);
        await supabase.storage.from(bucket).remove([path]);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const validateFileType = (file, allowedTypes) => {
    if (!allowedTypes || allowedTypes === '*') return true;
    const types = allowedTypes.split(',').map(t => t.trim().toLowerCase());
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    const fileMime = file.type.toLowerCase();
    
    return types.some(type => {
      if (type.startsWith('.')) return fileExt === type;
      if (type.endsWith('/*')) return fileMime.startsWith(type.replace('/*', ''));
      return fileMime === type;
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return ImageIcon;
    if (['pdf'].includes(ext)) return FileText;
    if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
    if (['doc', 'docx', 'txt'].includes(ext)) return FileText;
    return File;
  };

  return { 
    uploadFile, 
    deleteFile, 
    validateFileType, 
    validateFileName,
    sanitizeFileName, // Exported for external use if needed
    formatFileSize, 
    getFileIcon, 
    isUploading 
  };
};