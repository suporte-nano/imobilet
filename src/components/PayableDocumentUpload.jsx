import React, { useState } from 'react';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { sanitizeFileName } from '@/lib/sanitizeFileName';

const PayableDocumentUpload = ({ value, onChange, disabled = false }) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 10MB.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type (PDF and images)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Apenas PDF e imagens (JPG, PNG, WEBP) são permitidos.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Sanitize filename
      const sanitizedName = sanitizeFileName(file.name);
      const fileExt = sanitizedName.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Simulate progress (Supabase doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('payable_documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payable_documents')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      onChange(publicUrl);

      toast({
        title: 'Upload concluído',
        description: 'Arquivo enviado com sucesso!',
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível fazer upload do arquivo.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  const getFileName = (url) => {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  return (
    <div className="space-y-2">
      {!value ? (
        <div className="relative">
          <input
            type="file"
            id="payable-document-upload"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            disabled={disabled || uploading}
          />
          <label
            htmlFor="payable-document-upload"
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              disabled || uploading
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mb-2" />
                <p className="text-sm text-gray-600">Enviando... {uploadProgress}%</p>
                <div className="w-48 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-emerald-600 mb-2" />
                <p className="text-sm text-gray-600 text-center px-4">
                  <span className="font-semibold text-emerald-600">Clique para fazer upload</span>
                  <br />
                  PDF ou imagens (máx. 10MB)
                </p>
              </>
            )}
          </label>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <File className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {getFileName(value)}
              </p>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Ver arquivo
              </a>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PayableDocumentUpload;