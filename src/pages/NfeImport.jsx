import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Trash2, ClipboardCheck, Link2, Search, FileBarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { API } from '@/lib/api';
import { fetchJson, queryKeys, listQueryOptions } from '@/lib/queries';
import TableSkeleton from '@/components/TableSkeleton';
import SefazImport from '@/components/SefazImport';
import { useAuth, PERM } from '@/contexts/AuthContext';

// Fluxo de cores: amarelo (falta vincular) -> laranja (pronta/em conferencia) -> verde (conferida)
const statusMap = {
  aguardando_vinculo: { label: 'Aguardando vinculo', order: 0, class: 'bg-amber-500/10 text-amber-400 border-amber-500/30', accent: 'border-l-amber-500' },
  pendente: { label: 'Pronta p/ conferencia', order: 1, class: 'bg-orange-500/10 text-orange-400 border-orange-500/30', accent: 'border-l-orange-500' },
  em_conferencia: { label: 'Em conferencia', order: 1, class: 'bg-orange-500/10 text-orange-400 border-orange-500/30', accent: 'border-l-orange-500' },
  conferida: { label: 'Conferida', order: 2, class: 'bg-green-500/10 text-green-400 border-green-500/30', accent: 'border-l-green-500' },
  divergente: { label: 'Conferida c/ divergencia', order: 2, class: 'bg-green-500/10 text-green-400 border-green-500/30', accent: 'border-l-green-500' },
};
const statusOrder = (s) => (statusMap[s]?.order ?? 1);

export default function NfeImport() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canManageNotas = hasPermission(PERM.NOTAS);

  const { data: notas = [], isPending, isFetching } = useQuery({
    queryKey: queryKeys.notas,
    queryFn: () => fetchJson('/notas'),
    ...listQueryOptions,
  });

  const fetchNotas = () => queryClient.invalidateQueries({ queryKey: queryKeys.notas });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${API}/notas/importar-xml`, formData);
      const importedNota = res.data.nota;
      const faltam = importedNota.total_itens - importedNota.itens_identificados;
      fetchNotas();
      if (faltam > 0) {
        toast.warning(`Nota ${importedNota.numero || ''} importada. Faltam ${faltam} produto(s) sem vinculo antes de conferir.`);
      } else {
        toast.success(`Nota ${importedNota.numero || ''} importada e pronta para conferencia.`);
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
    const q = busca.trim().toLowerCase();
    const base = q
      ? notas.filter(n => (
          (n.numero || '').toLowerCase().includes(q) ||
          (n.fornecedor_nome || '').toLowerCase().includes(q) ||
          (n.fornecedor_cnpj || '').includes(q)
        ))
      : notas;
    // Agrupa por status (amarelo -> laranja -> verde) e, dentro do grupo, mais recentes primeiro
    return [...base].sort((a, b) => {
      const diff = statusOrder(a.status) - statusOrder(b.status);
      if (diff !== 0) return diff;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  }, [notas, busca]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-[#F4F4F5] tracking-tight">Notas Fiscais</h1>

      {canManageNotas && (
        <>
          <div className="bg-[#121212] border border-[#27272A] border-dashed rounded-md p-8 flex flex-col items-center justify-center gap-4 hover:border-blue-500/40 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-8 w-8 text-[#71717A]" />
            <div className="text-center">
              <p className="text-[#F4F4F5] font-medium">Importar XML da NF-e</p>
              <p className="text-xs text-zinc-500 mt-1">Clique ou arraste o arquivo XML</p>
            </div>
            <input ref={fileInputRef} type="file" accept=".xml" className="hidden" onChange={handleUpload} />
            {uploading && <p className="text-[#71717A] text-sm">Processando...</p>}
          </div>

          <SefazImport onImported={fetchNotas} />
        </>
      )}

      <div className="bg-[#121212] border border-[#27272A] rounded-md" data-refetching={isFetching ? 'true' : undefined}>
        <div className="p-4 border-b border-[#27272A] flex items-center gap-3">
          <h3 className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 shrink-0">Notas Importadas ({notas.length})</h3>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por numero, fornecedor..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#1A1A1A] border border-[#27272A] rounded text-[#F4F4F5] placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>
        {isPending ? (
          <div className="p-4"><TableSkeleton rows={6} cols={7} /></div>
        ) : notas.length === 0 ? (
          <div className="p-8 text-center text-zinc-600">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma nota importada</p>
            <p className="text-xs mt-1">Importe um arquivo XML de NF-e</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[#27272A]">
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1A1A1A]">Numero</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1A1A1A]">Fornecedor</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1A1A1A]">Valor</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1A1A1A]">Itens</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1A1A1A]">Identificados</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1A1A1A]">Status</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1A1A1A]">Acoes</TableHead>
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
                const faltamVinculo = Math.max(0, nota.total_itens - nota.itens_identificados);
                const aguardando = nota.status === 'aguardando_vinculo';
                const finalizada = nota.status === 'conferida' || nota.status === 'divergente';
                return (
                  <TableRow key={nota.id} className={`border-[#1A1A1A] hover:bg-[#1A1A1A]/50 border-l-4 ${st.accent}`}>
                    <TableCell className="font-mono text-sm text-[#F4F4F5]">
                      {nota.numero || '-'}
                      {aguardando && (
                        <span className="block mt-0.5 text-[10px] font-sans text-amber-400/90">Faltam {faltamVinculo} produto(s) sem vinculo</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[#A1A1AA]">{nota.fornecedor_nome || '-'}</TableCell>
                    <TableCell className="font-mono text-sm text-[#F4F4F5]">R$ {nota.valor_total?.toFixed(2)}</TableCell>
                    <TableCell className="font-mono text-sm text-[#A1A1AA]">{nota.total_itens}</TableCell>
                    <TableCell className="font-mono text-sm">
                      <span className={nota.itens_identificados === nota.total_itens ? 'text-green-400' : 'text-amber-400'}>
                        {nota.itens_identificados}/{nota.total_itens}
                      </span>
                    </TableCell>
                    <TableCell><Badge className={`${st.class} border text-[10px]`}>{st.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {aguardando ? (
                          <button onClick={() => navigate(`/vinculacao/${nota.id}`)}
                            className="p-1.5 hover:bg-amber-600/20 rounded text-amber-400 transition-colors" title="Vincular Produtos">
                            <Link2 className="h-4 w-4" />
                          </button>
                        ) : !finalizada ? (
                          <button onClick={() => navigate(`/conferencia/${nota.id}`)}
                            className="p-1.5 hover:bg-orange-600/20 rounded text-orange-400 transition-colors" title="Conferir">
                            <ClipboardCheck className="h-4 w-4" />
                          </button>
                        ) : null}
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
