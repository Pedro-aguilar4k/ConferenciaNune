import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Upload, FileText, Trash2, ClipboardCheck, Link2, Search, FileBarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { API } from '@/lib/api';
import SefazImport from '@/components/SefazImport';
import { useAuth, PERM } from '@/contexts/AuthContext';

const statusMap = {
  pendente: { label: 'Pendente', class: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  em_conferencia: { label: 'Em Conferencia', class: 'bg-blue-500/10 text-[#7B84E0] border-[#4B52C4]/30' },
  conferida: { label: 'Conferida', class: 'bg-green-500/10 text-green-400 border-green-500/20' },
  divergente: { label: 'Divergente', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export default function NfeImport() {
  const [notas, setNotas] = useState([]);
  const [busca, setBusca] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canManageNotas = hasPermission(PERM.NOTAS);

  useEffect(() => { fetchNotas(); }, []);

  const fetchNotas = async () => {
    try {
      const res = await axios.get(`${API}/notas`);
      setNotas(res.data);
    } catch (e) { console.error(e); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${API}/notas/importar-xml`, formData);
      const importedNota = res.data.nota;
      const hasPending = importedNota.itens_identificados < importedNota.total_itens;
      toast.success(`Nota ${importedNota.numero || ''} importada! ${importedNota.itens_identificados}/${importedNota.total_itens} itens identificados.`);
      fetchNotas();
      if (hasPending) {
        navigate(`/vinculacao/${importedNota.id}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao importar XML');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/notas/${id}`);
      toast.success('Nota removida');
      fetchNotas();
    } catch (e) { toast.error('Erro ao remover nota'); }
  };

  const notasFiltradas = useMemo(() => {
    if (!busca.trim()) return notas;
    const q = busca.toLowerCase();
    return notas.filter(n => (
      (n.numero || '').toLowerCase().includes(q) ||
      (n.fornecedor_nome || '').toLowerCase().includes(q) ||
      (n.fornecedor_cnpj || '').includes(q)
    ));
  }, [notas, busca]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-[#E8E9FF] tracking-tight">Notas Fiscais</h1>

      {canManageNotas && (
        <>
          <div className="bg-[#12134A] border border-[#2D3090]/60 border-dashed rounded-md p-8 flex flex-col items-center justify-center gap-4 hover:border-blue-500/40 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-8 w-8 text-[#7B84E0]" />
            <div className="text-center">
              <p className="text-[#E8E9FF] font-medium">Importar XML da NF-e</p>
              <p className="text-xs text-zinc-500 mt-1">Clique ou arraste o arquivo XML</p>
            </div>
            <input ref={fileInputRef} type="file" accept=".xml" className="hidden" onChange={handleUpload} />
            {uploading && <p className="text-[#7B84E0] text-sm">Processando...</p>}
          </div>

          <SefazImport onImported={fetchNotas} />
        </>
      )}

      <div className="bg-[#12134A] border border-[#2D3090]/60 rounded-md">
        <div className="p-4 border-b border-[#2D3090]/60 flex items-center gap-3">
          <h3 className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 shrink-0">Notas Importadas ({notas.length})</h3>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por numero, fornecedor..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#1E2070] border border-[#2D3090]/60 rounded text-[#E8E9FF] placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>
        {notas.length === 0 ? (
          <div className="p-8 text-center text-zinc-600">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma nota importada</p>
            <p className="text-xs mt-1">Importe um arquivo XML de NF-e</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[#2D3090]/60">
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1E2070]">Numero</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1E2070]">Fornecedor</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1E2070]">Valor</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1E2070]">Itens</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1E2070]">Identificados</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1E2070]">Status</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1E2070]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-zinc-600 py-8 text-sm">
                    Nenhuma nota encontrada para &quot;{busca}&quot;
                  </TableCell>
                </TableRow>
              ) : notasFiltradas.map(nota => {
                const st = statusMap[nota.status] || statusMap.pendente;
                const temRelatorio = !!nota.relatorio_salvo;
                return (
                  <TableRow key={nota.id} className="border-[#1A1A1A] hover:bg-[#1E2070]/50">
                    <TableCell className="font-mono text-sm text-[#E8E9FF]">{nota.numero || '-'}</TableCell>
                    <TableCell className="text-sm text-[#9BA0D0]">{nota.fornecedor_nome || '-'}</TableCell>
                    <TableCell className="font-mono text-sm text-[#E8E9FF]">R$ {nota.valor_total?.toFixed(2)}</TableCell>
                    <TableCell className="font-mono text-sm text-[#9BA0D0]">{nota.total_itens}</TableCell>
                    <TableCell className="font-mono text-sm">
                      <span className={nota.itens_identificados === nota.total_itens ? 'text-green-400' : 'text-yellow-400'}>
                        {nota.itens_identificados}/{nota.total_itens}
                      </span>
                    </TableCell>
                    <TableCell><Badge className={`${st.class} border text-[10px]`}>{st.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {nota.itens_identificados < nota.total_itens && nota.status !== 'conferida' ? (
                          <button onClick={() => navigate(`/vinculacao/${nota.id}`)}
                            className="p-1.5 hover:bg-yellow-600/20 rounded text-yellow-400 transition-colors" title="Vincular Produtos">
                            <Link2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <button onClick={() => navigate(`/conferencia/${nota.id}`)}
                            className="p-1.5 hover:bg-[#2D3090]/30 rounded text-[#7B84E0] transition-colors" title="Conferir">
                            <ClipboardCheck className="h-4 w-4" />
                          </button>
                        )}
                        {temRelatorio && (
                          <button onClick={() => navigate(`/relatorio/${nota.id}`)}
                            className="p-1.5 hover:bg-green-600/20 rounded text-green-400 transition-colors" title="Ver Relatorio de Conferencia">
                            <FileBarChart2 className="h-4 w-4" />
                          </button>
                        )}
                        {canManageNotas && (
                          <button onClick={() => handleDelete(nota.id)}
                            className="p-1.5 hover:bg-red-600/20 rounded text-red-400 transition-colors" title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
