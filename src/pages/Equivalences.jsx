import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Trash2, Link2, Filter } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { API } from '@/lib/api';

export default function Equivalences() {
  const [equivalencias, setEquivalencias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [filterCnpj, setFilterCnpj] = useState('all');

  const fetchEquivalencias = useCallback(async () => {
    try {
      const params = {};
      if (filterCnpj && filterCnpj !== 'all') params.fornecedor_cnpj = filterCnpj;
      const res = await axios.get(`${API}/equivalencias`, { params });
      setEquivalencias(res.data);
    } catch (e) { console.error(e); }
  }, [filterCnpj]);

  useEffect(() => {
    axios.get(`${API}/fornecedores`).then(r => setFornecedores(r.data)).catch(console.error);
  }, []);

  useEffect(() => { fetchEquivalencias(); }, [fetchEquivalencias]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/equivalencias/${id}`);
      toast.success('Equivalencia removida');
      fetchEquivalencias();
    } catch (e) { toast.error('Erro ao remover'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-[#E8E9FF] tracking-tight">Equivalencias</h1>
          <p className="text-zinc-500 text-sm mt-1">Vinculos aprendidos pelo sistema ({equivalencias.length})</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-zinc-500" />
        <Select value={filterCnpj} onValueChange={setFilterCnpj}>
          <SelectTrigger className="w-[300px] bg-[#12134A] border-[#2D3090]/60 text-[#E8E9FF]">
            <SelectValue placeholder="Filtrar por fornecedor" />
          </SelectTrigger>
          <SelectContent className="bg-[#12134A] border-[#2D3090]/60">
            <SelectItem value="all" className="text-[#E8E9FF] focus:bg-[#1E2070] focus:text-[#E8E9FF]">Todos os fornecedores</SelectItem>
            {fornecedores.map(f => (
              <SelectItem key={f.cnpj} value={f.cnpj} className="text-[#E8E9FF] focus:bg-[#1E2070] focus:text-[#E8E9FF]">{f.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-[#12134A] border border-[#2D3090]/60 rounded-md overflow-hidden">
        {equivalencias.length === 0 ? (
          <div className="p-8 text-center text-zinc-600">
            <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma equivalencia encontrada</p>
            <p className="text-xs mt-1">Os vinculos sao criados automaticamente ao confirmar produtos durante a conferencia</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[#2D3090]/60">
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1E2070]">Fornecedor</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1E2070]">Cod. Forn.</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1E2070]">Descricao NF-e</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1E2070]">Cod. Interno</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1E2070]">Descricao Interna</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1E2070]">Data</TableHead>
                <TableHead className="text-[10px] uppercase tracking-[0.1em] text-zinc-500 bg-[#1E2070]">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equivalencias.map(eq => (
                <TableRow key={eq.id} className="border-[#1A1A1A] hover:bg-[#1E2070]/50">
                  <TableCell className="text-sm text-[#9BA0D0]">{eq.fornecedor_nome}</TableCell>
                  <TableCell className="font-mono text-sm text-[#E8E9FF]">{eq.codigo_fornecedor}</TableCell>
                  <TableCell className="text-sm text-zinc-500 max-w-[180px] truncate">{eq.descricao_nfe}</TableCell>
                  <TableCell className="font-mono text-sm text-[#7B84E0]">{eq.produto_interno_codigo}</TableCell>
                  <TableCell className="text-sm text-[#E8E9FF] max-w-[180px] truncate">{eq.produto_interno_descricao}</TableCell>
                  <TableCell className="text-xs text-zinc-500">{eq.created_at ? new Date(eq.created_at).toLocaleDateString('pt-BR') : '-'}</TableCell>
                  <TableCell>
                    <button onClick={() => handleDelete(eq.id)}
                      className="p-1.5 hover:bg-red-600/20 rounded text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
