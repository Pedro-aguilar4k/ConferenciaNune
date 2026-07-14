import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ShieldCheck, CloudDownload, Trash2, KeyRound, Loader2, ChevronDown } from 'lucide-react';
import { API } from '@/lib/api';

const ambienteLabel = {
  homologacao: 'Homologação',
  producao: 'Produção',
};

export default function SefazImport({ onImported }) {
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // formulário de upload
  const [senha, setSenha] = useState('');
  const [ambiente, setAmbiente] = useState('homologacao');
  const [enviando, setEnviando] = useState(false);
  const fileRef = useRef(null);

  // busca
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API}/sefaz/certificado`);
      setCert(res.data.configurado ? res.data : null);
      if (res.data.configurado) setOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCert = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!senha.trim()) {
      toast.error('Informe a senha do certificado antes de selecionar o arquivo.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(
        `${API}/sefaz/certificado?senha=${encodeURIComponent(senha)}&ambiente=${ambiente}`,
        formData,
      );
      toast.success(`Certificado configurado para o CNPJ ${res.data.cnpj}`);
      setSenha('');
      setCert(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao validar o certificado');
    } finally {
      setEnviando(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemoverCert = async () => {
    try {
      await axios.delete(`${API}/sefaz/certificado`);
      toast.success('Certificado removido');
      setCert(null);
      setResultado(null);
    } catch (e) {
      toast.error('Erro ao remover certificado');
    }
  };

  const handleBuscar = async () => {
    setBuscando(true);
    setResultado(null);
    try {
      const res = await axios.post(`${API}/sefaz/buscar`, { ultimo_nsu: '0', max_lotes: 5 });
      setResultado(res.data);
      const n = res.data.total_importadas;
      if (n > 0) {
        toast.success(`${n} nota(s) importada(s) do SEFAZ!`);
        onImported?.();
      } else if (res.data.duplicadas > 0) {
        toast.info('Nenhuma nota nova. Todas já haviam sido importadas.');
      } else {
        toast.info(res.data.xMotivo || 'Nenhum documento novo encontrado no SEFAZ.');
      }
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao consultar o SEFAZ');
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="bg-[#121212] border border-[#27272A] rounded-md">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
          <CloudDownload className="h-4 w-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#F4F4F5] font-medium text-sm">Buscar notas no SEFAZ</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Distribuição de DF-e — importa notas emitidas contra o seu CNPJ usando certificado A1
          </p>
        </div>
        {cert && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-green-400 border border-green-500/20 bg-green-500/10 rounded px-2 py-1">
            <ShieldCheck className="h-3 w-3" /> Configurado
          </span>
        )}
        <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-[#27272A] p-4 space-y-4">
          {loading ? (
            <p className="text-sm text-zinc-500">Carregando...</p>
          ) : cert ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoField label="CNPJ" value={cert.cnpj} />
                <InfoField label="Ambiente" value={ambienteLabel[cert.ambiente] || cert.ambiente} />
                <InfoField
                  label="Válido até"
                  value={cert.validade ? new Date(cert.validade).toLocaleDateString('pt-BR') : '-'}
                />
                <InfoField label="Último NSU processado" value={cert.ultimo_nsu || '0'} />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleBuscar}
                  disabled={buscando}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-md px-4 py-2.5 transition-colors"
                >
                  {buscando
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Consultando SEFAZ...</>
                    : <><CloudDownload className="h-4 w-4" /> Buscar notas agora</>}
                </button>
                <button
                  onClick={handleRemoverCert}
                  className="inline-flex items-center justify-center gap-2 border border-[#27272A] hover:border-red-500/40 hover:text-red-400 text-zinc-400 text-sm rounded-md px-4 py-2.5 transition-colors"
                >
                  <Trash2 className="h-4 w-4" /> Remover certificado
                </button>
              </div>

              {resultado && (
                <div className="bg-[#1A1A1A] border border-[#27272A] rounded-md p-3 text-sm space-y-1">
                  <p className="text-[#F4F4F5]">
                    <span className="text-green-400 font-medium">{resultado.total_importadas}</span> importada(s),{' '}
                    <span className="text-zinc-400">{resultado.duplicadas}</span> já existentes,{' '}
                    <span className="text-zinc-400">{resultado.resumos_ignorados}</span> resumo(s) ignorado(s)
                  </p>
                  <p className="text-xs text-zinc-500">
                    SEFAZ: {resultado.cStat} — {resultado.xMotivo}
                  </p>
                  {resultado.importadas?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {resultado.importadas.map((n) => (
                        <li key={n.chave} className="text-xs text-[#A1A1AA] font-mono">
                          NF {n.numero} · {n.fornecedor} · R$ {Number(n.valor_total || 0).toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500">
                Configure seu certificado digital A1 (.pfx ou .p12) para autenticar no SEFAZ.
                O certificado é validado no servidor e o CNPJ é extraído automaticamente.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-zinc-500 block mb-1">Senha do certificado</label>
                  <div className="relative">
                    <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
                    <input
                      type="password"
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      placeholder="Senha do arquivo A1"
                      className="w-full pl-8 pr-3 py-2 text-sm bg-[#1A1A1A] border border-[#27272A] rounded text-[#F4F4F5] placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-zinc-500 block mb-1">Ambiente</label>
                  <select
                    value={ambiente}
                    onChange={e => setAmbiente(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#1A1A1A] border border-[#27272A] rounded text-[#F4F4F5] focus:outline-none focus:border-blue-500/50 transition-colors"
                  >
                    <option value="homologacao">Homologação (teste)</option>
                    <option value="producao">Produção</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={enviando}
                className="w-full inline-flex items-center justify-center gap-2 border border-dashed border-[#27272A] hover:border-blue-500/40 text-zinc-300 text-sm rounded-md px-4 py-3 transition-colors disabled:opacity-60"
              >
                {enviando
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Validando certificado...</>
                  : <><KeyRound className="h-4 w-4 text-blue-400" /> Selecionar certificado A1 (.pfx / .p12)</>}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pfx,.p12"
                className="hidden"
                onChange={handleUploadCert}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="bg-[#1A1A1A] border border-[#27272A] rounded-md px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-sm text-[#F4F4F5] font-mono mt-0.5 truncate">{value || '-'}</p>
    </div>
  );
}
