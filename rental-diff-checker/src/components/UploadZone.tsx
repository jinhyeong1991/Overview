import { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';

interface UploadZoneProps {
  label: string;
  sublabel: string;
  file: File | null;
  onFile: (f: File | null) => void;
  accent?: 'blue' | 'slate';
}

export function UploadZone({ label, sublabel, file, onFile, accent = 'blue' }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const colors = accent === 'blue'
    ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-600'
    : 'border-slate-400 bg-slate-50 dark:bg-slate-800/40 dark:border-slate-500';

  const dragColors = accent === 'blue'
    ? 'border-blue-600 bg-blue-100 dark:bg-blue-900/40'
    : 'border-slate-500 bg-slate-100 dark:bg-slate-700/40';

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.xlsx') || f?.name.endsWith('.xls')) onFile(f);
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer min-h-[180px] ${dragging ? dragColors : colors}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {file ? (
        <div className="flex flex-col items-center gap-2 w-full">
          <FileSpreadsheet className="w-10 h-10 text-green-500" />
          <span className="text-sm font-medium text-center break-all px-2">{file.name}</span>
          <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
          <button
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 text-red-400"
            onClick={(e) => { e.stopPropagation(); onFile(null); }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
          <Upload className={`w-10 h-10 ${accent === 'blue' ? 'text-blue-400' : 'text-slate-400'}`} />
          <div>
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
          </div>
          <span className="text-xs text-muted-foreground border rounded px-2 py-0.5 mt-1">
            클릭 또는 드래그 앤 드롭
          </span>
        </div>
      )}
    </div>
  );
}
