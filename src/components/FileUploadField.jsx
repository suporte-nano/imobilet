import React, { useState, useCallback } from 'react';
import { UploadCloud, X, Loader2, File } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { normalizeFileArray } from '@/lib/dataMigration';

const FileUploadField = ({
  label,
  accept,
  multiple = true,
  value = [],
  onChange,
  bucket = 'property_documents',
  pathPrefix = 'uploads',
  maxSize = 10 * 1024 * 1024, // 10MB default
  description
}) => {
  const { uploadFile, deleteFile, validateFileType, validateFileName, formatFileSize, getFileIcon } = useFileUpload();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [localUploading, setLocalUploading] = useState([]);

  // Normalize incoming value to ensure it handles JSONB / text arrays securely
  const normalizedValue = normalizeFileArray(value);

  const processFiles = async (files) => {
    const validFiles = [];
    for (const file of files) {
      if (!validateFileName(file.name)) {
        toast({
          variant: "destructive",
          title: "Nome de arquivo inválido",
          description: `O arquivo "${file.name}" não pôde ser processado. Renomeie e tente novamente.`
        });
        continue;
      }
      if (!validateFileType(file, accept)) {
        toast({
          variant: "destructive",
          title: "Tipo de arquivo inválido",
          description: `${file.name} não é suportado. Tipos permitidos: ${accept}`
        });
        continue;
      }
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: "Arquivo muito grande",
          description: `${file.name} excede o limite de ${formatFileSize(maxSize)}.`
        });
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const filesToUpload = multiple ? validFiles : [validFiles[0]];

    setLocalUploading(prev => [...prev, ...filesToUpload.map(f => ({ name: f.name, size: f.size }))]);

    try {
      const newFileObjects = [];
      for (const file of filesToUpload) {
        // uploadFile hook now automatically sanitizes the filename before sending to Supabase
        const fileObj = await uploadFile(file, bucket, pathPrefix);
        newFileObjects.push(fileObj);
        setLocalUploading(prev => prev.filter(f => f.name !== file.name));
      }

      toast({
        title: "Upload concluído",
        description: `${newFileObjects.length} arquivo(s) enviado(s) com sucesso.`
      });

      if (multiple) {
        onChange([...normalizedValue, ...newFileObjects]);
      } else {
        if (normalizedValue.length > 0 && normalizedValue[0].url) {
          await deleteFile(bucket, normalizedValue[0].url);
        }
        onChange(newFileObjects);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.message || "Ocorreu um erro ao enviar os arquivos."
      });
      setLocalUploading([]);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, [accept, multiple, maxSize, normalizedValue, onChange]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const handleRemove = async (fileToRemove) => {
    try {
      if (fileToRemove.url) {
        await deleteFile(bucket, fileToRemove.url);
      }
      onChange(normalizedValue.filter(f => f.url !== fileToRemove.url));
      toast({
        title: "Arquivo removido",
        description: "O arquivo foi excluído com sucesso."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: "Não foi possível remover o arquivo."
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="font-medium text-gray-900">{label}</Label>
        {normalizedValue.length > 0 && (
          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-medium">
            {normalizedValue.length} {normalizedValue.length === 1 ? 'arquivo' : 'arquivos'}
          </span>
        )}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 transition-all duration-200 flex flex-col items-center justify-center ${
          isDragging ? 'border-emerald-500 bg-emerald-50 scale-[1.01]' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          id={`file-upload-${label.replace(/\s+/g, '-')}`}
        />
        <label
          htmlFor={`file-upload-${label.replace(/\s+/g, '-')}`}
          className="cursor-pointer flex flex-col items-center justify-center text-center space-y-3 w-full"
        >
          <div className={`p-4 rounded-full shadow-sm border transition-colors ${isDragging ? 'bg-emerald-100 border-emerald-200' : 'bg-white border-gray-100'}`}>
            <UploadCloud className={`h-8 w-8 ${isDragging ? 'text-emerald-700' : 'text-emerald-600'}`} />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700 block mb-1">
              Arraste os arquivos aqui ou <span className="text-emerald-600 hover:text-emerald-700 hover:underline">clique para buscar</span>
            </span>
            {description && <span className="text-xs text-gray-500 block mb-2">{description}</span>}
            <span className="text-[10px] text-gray-400 font-mono bg-gray-200/50 px-2 py-1 rounded">
              {accept}
            </span>
          </div>
        </label>
      </div>

      {(localUploading.length > 0 || normalizedValue.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          
          {localUploading.map((file, idx) => (
            <div key={`uploading-${idx}`} className="flex items-center p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg animate-pulse shadow-sm">
              <div className="h-10 w-10 flex-shrink-0 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                {/* User sees the original filename while uploading */}
                <p className="text-sm font-medium text-emerald-800 truncate">{file.name}</p>
                <p className="text-xs text-emerald-600">{formatFileSize(file.size)} • Enviando...</p>
              </div>
            </div>
          ))}

          {normalizedValue.map((fileObj, idx) => {
            // User sees the original filename saved in JSONB
            const fileName = fileObj.original_name || 'Arquivo';
            const fileUrl = fileObj.url;
            const Icon = getFileIcon(fileName);
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => fileName.toLowerCase().endsWith(ext));

            return (
              <div key={`file-${idx}`} className="group relative flex items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-emerald-300 hover:shadow-md transition-all">
                {isImage ? (
                  <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-100 overflow-hidden mr-3 border border-gray-200">
                    <img src={fileUrl} alt={fileName} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-50 border border-gray-100 text-gray-500 flex items-center justify-center mr-3 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0 pr-8">
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-700 hover:text-emerald-600 truncate block" title={fileName}>
                    {fileName}
                  </a>
                  <p className="text-xs text-gray-400 font-medium">
                    {fileObj.size ? formatFileSize(fileObj.size) : 'Salvo na nuvem'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(fileObj)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white border border-gray-100 text-gray-400 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                  title="Remover arquivo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileUploadField;