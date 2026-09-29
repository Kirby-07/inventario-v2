import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Check, Database, Code } from 'lucide-react';

interface SqlExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlExportModal: React.FC<SqlExportModalProps> = ({ isOpen, onClose }) => {
  const [sqlContent, setSqlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch('/api/export/mariadb.sql')
        .then((res) => res.text())
        .then((data) => {
          setSqlContent(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Error cargando script SQL:', err);
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([sqlContent], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario_mariadb_${new Date().toISOString().slice(0, 10)}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 text-white rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Script Relacional MariaDB / MySQL</h2>
              <p className="text-xs text-slate-500">
                DDL de tablas relacionales (equipos y perifericos) y DML con datos actuales
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
            <Code className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Estructura Relacional Normalizada:</span>
              El sistema vincula la tabla principal <code className="bg-blue-100/70 px-1 py-0.5 rounded">equipos</code> con la tabla <code className="bg-blue-100/70 px-1 py-0.5 rounded">perifericos</code> mediante una clave foránea (<code className="bg-blue-100/70 px-1 py-0.5 rounded">FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE</code>).
            </div>
          </div>

          <div className="relative">
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-[50vh] leading-relaxed">
              {isLoading ? 'Cargando script SQL desde el servidor...' : sqlContent}
            </pre>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado al portapapeles' : 'Copiar SQL'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar .sql
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
