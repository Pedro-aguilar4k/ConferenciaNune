import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ScanBarcode, ArrowLeft, PlayCircle, StopCircle, CheckCircle2, XCircle, SkipForward, PackageCheck, Printer, Barcode, CloudUpload, ClipboardList } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { API } from '@/lib/api';
import { useScanQueue } from '@/hooks/useScanQueue';

const newScanId = () => (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export default function Conference() {
  const { notaId } = useParams();
  if (!notaId) return <NotaSelector />;
  return <ConferenceGame notaId={notaId} />;
}

function NotaSelector() {
  const [notas, setNotas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/notas`).then(r => setNotas(r.data)).catch(console.error);
  }, []);

  const available = notas.filter(n => ['pendente', 'em_conferencia'].includes(n.status));

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-[#F4F4F5] tracking-tight">Conferencia</h1>
      <p className="text-zinc-500 text-sm">Selecione uma nota para iniciar a conferencia</p>
      {available.length === 0 ? (
        <div className="bg-[#121212] border border-[#27272A] rounded-md p-12 text-center text-zinc-600">
          <ScanBarcode className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhuma nota pendente</p>
          <p className="text-xs mt-1">Importe uma NF-e na aba Notas Fiscais</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {available.map(nota => (
            <button key={nota.id} onClick={() => navigate(`/conferencia/${nota.id}`)}
              className="bg-[#121212] border border-[#27272A] rounded-md p-4 text-left hover:border-blue-500/40 transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[#F4F4F5] text-lg">NF-e {nota.numero || '-'}</span>
                  <span className="text-zinc-500 text-sm ml-3">{nota.fornecedor_nome}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-zinc-400">{nota.itens_identificados}/{nota.total_itens} identificados</span>
                  <PlayCircle className="h-5 w-5 text-[#71717A] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConferenceGame({ notaId }) {
  const [nota, setNota] = useState(null);
  const [itens, setItens] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [scanValue, setScanValue] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [operadorNome, setOperadorNome] = useState('');
  const [finalizing, setFinalizing] = useState(false);
  const [addBarcodeOpen, setAddBarcodeOpen] = useState(false);
  const [addBarcodeValue, setAddBarcodeValue] = useState('');
  const scannerRef = useRef(null);
  const addBarcodeRef = useRef(null);
  const feedbackTimer = useRef(null);
  const completeTimer = useRef(null);
  const navigate = useNavigate();

  // Reconcilia um item com a resposta autoritativa do servidor (chega em 2o plano)
  const reconcileItem = useCallback((serverItem) => {
    if (!serverItem?.id) return;
    setItens(prev => prev.map(i => i.id === serverItem.id
      ? { ...i, quantidade_conferida: serverItem.quantidade_conferida }
      : i));
  }, []);

  const onScanResult = useCallback((data) => {
    console.log("[v0] onScanResult", { success: data?.success, tipo: data?.tipo, itemId: data?.item?.id, qtd: data?.item?.quantidade_conferida });
    if (data?.item) reconcileItem(data.item);
    if (data?.tipo === 'duplicado_ignorado') return; // replay silencioso após recuperação
    clearTimeout(completeTimer.current);
    if (data?.success) {
      if (data.tipo === 'completo') {
        setFeedback({ kind: 'completo', title: 'ITEM CONFERIDO', sub: data.item?.produto_interno_codigo });
        clearTimeout(feedbackTimer.current);
        feedbackTimer.current = setTimeout(() => setFeedback(null), 1500);
        completeTimer.current = setTimeout(() => setActiveItem(null), 1500);
      } else if (data.item) {
        setActiveItem(data.item);
      }
    } else {
      showServerError(data);
    }
  }, [reconcileItem]);

  const { enqueue, flush, pending: scansPendentes, syncError } = useScanQueue(notaId, { onResult: onScanResult });

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/notas/${notaId}`);
      setNota(res.data.nota);
      setItens(res.data.itens);
      const pendingItems = res.data.itens.filter(i => !i.produto_interno_id && !i.ignorado);
      if (pendingItems.length > 0 && !['conferida', 'divergente', 'em_conferencia'].includes(res.data.nota.status)) {
        navigate(`/vinculacao/${notaId}`, { replace: true });
      }
    } catch (e) {
      toast.error('Erro ao carregar nota');
      navigate('/conferencia');
    }
  }, [notaId, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const dialogsAbertos = reviewOpen || addBarcodeOpen;
  useEffect(() => {
    if (nota?.status !== 'em_conferencia' || dialogsAbertos) return;
    const t = setInterval(() => {
      if (document.activeElement !== scannerRef.current) scannerRef.current?.focus();
    }, 800);
    scannerRef.current?.focus();
    return () => clearInterval(t);
  }, [nota?.status, dialogsAbertos]);

  useEffect(() => () => { clearTimeout(feedbackTimer.current); clearTimeout(completeTimer.current); }, []);

  const showFeedback = (fb, ms = 2600) => {
    clearTimeout(feedbackTimer.current);
    setFeedback(fb);
    feedbackTimer.current = setTimeout(() => setFeedback(null), ms);
  };

  const showServerError = (d) => {
    if (d.tipo === 'produto_errado') {
      showFeedback({ kind: 'erro', title: 'PRODUTO NAO E O INDICADO', sub: `Bipado: ${d.scanned?.produto_interno_codigo || d.scanned?.codigo || ''} - ${d.scanned?.descricao_nfe || d.scanned?.descricao || ''}` });
    } else if (d.tipo === 'ja_conferido') {
      showFeedback({ kind: 'aviso', title: 'ITEM JA CONFERIDO', sub: `${d.item?.produto_interno_codigo || ''} ja foi contado por completo` });
    } else if (d.tipo === 'nao_pertence') {
      showFeedback({ kind: 'erro', title: 'PRODUTO NAO PERTENCE A ESTA NOTA', sub: `${d.scanned?.codigo || ''} - ${d.scanned?.descricao || ''}` });
    } else {
      showFeedback({ kind: 'erro', title: 'CODIGO NAO ENCONTRADO', sub: 'Codigo nao pertence a esta nota' });
    }
  };

  const handleStart = async () => {
    try {
      const res = await axios.post(`${API}/conferencias/iniciar/${notaId}`);
      setNota(res.data.nota);
      setItens(res.data.itens);
      setActiveItem(null);
      toast.success('Conferencia iniciada! Bipe o primeiro produto.');
    } catch (e) { toast.error(e.response?.data?.detail || 'Erro ao iniciar'); }
  };

  // Incrementa localmente (otimista) e devolve o item atualizado
  const optimisticInc = useCallback((itemId) => {
    let updated = null;
    setItens(prev => prev.map(i => {
      if (i.id !== itemId) return i;
      const nova = Math.min(i.quantidade, (i.quantidade_conferida || 0) + 1);
      updated = { ...i, quantidade_conferida: nova };
      return updated;
    }));
    if (updated) setActiveItem(updated);
    return updated;
  }, []);

  // Decide, localmente, qual item deve receber +1 (espelha a regra do backend)
  const resolveIncrementTarget = useCallback((code) => {
    const matches = (i) => i.ean === code || i.produto_interno_codigo === code;
    if (activeItem && activeItem.quantidade_conferida < activeItem.quantidade) {
      const fresh = itens.find(i => i.id === activeItem.id);
      return fresh && matches(fresh) ? fresh.id : null; // produto diferente => backend decide
    }
    const cand = itens.find(i => matches(i) && i.quantidade_conferida < i.quantidade);
    return cand ? cand.id : null;
  }, [activeItem, itens]);

  const handleScan = (e) => {
    if (e.key !== 'Enter' || e.nativeEvent?.isComposing || e.keyCode === 229 || !scanValue.trim()) return;
    const code = scanValue.trim();
    setScanValue('');
    const scan_uuid = newScanId();
    const activeId = activeItem?.id || null;
    // Atualizacao otimista: o numero sobe na hora, sem esperar o servidor
    const target = resolveIncrementTarget(code);
    if (target) {
      setFeedback(null);
      optimisticInc(target);
    }
    // Persiste/env­ia em 2o plano com retry (idempotente). Nunca perde a bipagem.
    enqueue({
      scan_uuid,
      endpoint: '/conferencias/leitura',
      body: { nota_id: notaId, codigo_barras: code, item_ativo_id: activeId, scan_uuid },
    });
  };

  const handleSelectItem = (item) => {
    setActiveItem(item);
    setFeedback(null);
    setAddBarcodeOpen(false);
  };

  const openAddBarcode = () => {
    if (!activeItem) return;
    setAddBarcodeOpen(true);
    setTimeout(() => addBarcodeRef.current?.focus(), 50);
  };

  const handleAddBarcode = (e) => {
    if (e.key !== 'Enter' || e.nativeEvent?.isComposing || e.keyCode === 229 || !addBarcodeValue.trim() || !activeItem) return;
    const code = addBarcodeValue.trim();
    setAddBarcodeValue('');
    setAddBarcodeOpen(false);
    const scan_uuid = newScanId();
    optimisticInc(activeItem.id);
    enqueue({
      scan_uuid,
      endpoint: '/conferencias/adicionar-codigo-item',
      body: { nota_id: notaId, item_nota_id: activeItem.id, codigo_barras: code, scan_uuid },
    });
    toast.success(`Codigo ${code} salvo no produto ${activeItem.produto_interno_codigo}.`);
  };

  const handleSkip = () => {
    setActiveItem(null);
    setFeedback(null);
    setAddBarcodeOpen(false);
    scannerRef.current?.focus();
  };

  const handleFinalize = () => {
    setOperadorNome('');
    setReviewOpen(true);
  };

  const handleConfirmFinalize = async () => {
    if (!operadorNome.trim() || finalizing) return;
    setFinalizing(true);
    try {
      // Garante que TODAS as bipagens foram salvas antes de fechar a nota
      await flush();
      const res = await axios.post(`${API}/conferencias/finalizar/${notaId}`, { operador: operadorNome.trim() });
      try { localStorage.removeItem(`conferencia:scanqueue:${notaId}`); } catch { /* ignore */ }
      setNota(res.data);
      setReviewOpen(false);
      toast.success('Conferencia finalizada!');
    } catch (e) {
      toast.error('Ainda ha leituras nao salvas. Verifique a conexao e tente novamente.');
    } finally {
      setFinalizing(false);
    }
  };

  const itensCompletos = useMemo(
    () => itens.filter(i => i.quantidade > 0 && i.quantidade_conferida >= i.quantidade).length,
    [itens]
  );
  const progressPct = useMemo(
    () => (itens.length > 0 ? Math.round((itensCompletos / itens.length) * 100) : 0),
    [itens.length, itensCompletos]
  );
  const allComplete = itens.length > 0 && itensCompletos === itens.length;

  const revisao = useMemo(() => {
    const divergentes = itens.filter(i => Number(i.quantidade_conferida) !== Number(i.quantidade));
    return { completos: itensCompletos, divergentes };
  }, [itens, itensCompletos]);

  if (!nota) return <div className="text-zinc-500">Carregando...</div>;

  const isActive = nota.status === 'em_conferencia';
  const isDone = ['conferida', 'divergente'].includes(nota.status);

  if (!isActive && !isDone) {
    return (
      <div className="space-y-6">
        <Header nota={nota} navigate={navigate} />
        <div className="bg-[#121212] border border-[#27272A] rounded-lg p-16 text-center">
          <ScanBarcode className="h-16 w-16 mx-auto mb-6 text-[#71717A]" />
          <h2 className="text-2xl text-[#F4F4F5] font-semibold mb-2">Pronto para conferir</h2>
          <p className="text-zinc-500 mb-8">{itens.length} itens vinculados. Pegue o leitor de codigo de barras e clique em iniciar.</p>
          <button onClick={handleStart}
            className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white text-xl font-semibold rounded-lg hover:bg-blue-500 transition-colors">
            <PlayCircle className="h-7 w-7" /> Iniciar Conferencia
          </button>
        </div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="space-y-6">
        <Header nota={nota} navigate={navigate} />
        <div className="bg-[#121212] border border-[#27272A] rounded-lg p-16 text-center">
          <PackageCheck className={`h-16 w-16 mx-auto mb-6 ${nota.status === 'conferida' ? 'text-green-400' : 'text-red-400'}`} />
          <h2 className="text-3xl text-[#F4F4F5] font-bold mb-2">
            {nota.status === 'conferida' ? 'NOTA CONFERIDA!' : 'FINALIZADA COM DIVERGENCIA'}
          </h2>
          <p className="text-zinc-500 mb-2">{itensCompletos} de {itens.length} itens conferidos</p>
          {nota.operador_conferencia && <p className="text-zinc-400 mb-6 text-sm">Conferido por: <span className="text-[#F4F4F5] font-semibold">{nota.operador_conferencia}</span></p>}
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => navigate(`/relatorio/${notaId}`)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors font-semibold">
              <Printer className="h-5 w-5" /> Imprimir Relatorio
            </button>
            <button onClick={() => navigate('/conferencia')}
              className="px-6 py-3 bg-[#1A1A1A] border border-zinc-700 text-zinc-200 rounded-md hover:bg-zinc-800 transition-colors">
              Voltar para Conferencias
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pctItem = activeItem && activeItem.quantidade > 0
    ? Math.min(100, Math.round((activeItem.quantidade_conferida / activeItem.quantidade) * 100)) : 0;

  return (
    <div className="space-y-4" onClick={() => scannerRef.current?.focus()}>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/conferencia')} className="p-1.5 hover:bg-[#1A1A1A] rounded transition-colors">
          <ArrowLeft className="h-5 w-5 text-zinc-400" />
        </button>
        <div>
          <h1 className="font-heading text-xl font-semibold text-[#F4F4F5]">NF-e {nota.numero || '-'}</h1>
          <p className="text-zinc-500 text-xs">{nota.fornecedor_nome}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {syncError ? (
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-red-400" title="Reconectando para salvar leituras">
              <CloudUpload className="h-3.5 w-3.5" /> Salvando ({scansPendentes})
            </span>
          ) : scansPendentes > 0 ? (
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-orange-400" title="Salvando leituras em segundo plano">
              <CloudUpload className="h-3.5 w-3.5 animate-pulse" /> {scansPendentes}
            </span>
          ) : (
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-green-500" title="Todas as leituras salvas">
              <CheckCircle2 className="h-3.5 w-3.5" /> Salvo
            </span>
          )}
          <button onClick={handleFinalize}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
              allComplete ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-[#1A1A1A] text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
            }`}>
            <StopCircle className="h-4 w-4" /> Finalizar
          </button>
        </div>
      </div>

      <div className="bg-[#121212] border border-[#27272A] rounded-md p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Progresso da Conferencia</span>
          <span className="font-mono text-lg text-[#F4F4F5] font-bold">{itensCompletos} / {itens.length} itens</span>
        </div>
        <Progress value={progressPct} className={`h-4 bg-[#1A1A1A] ${progressPct === 100 ? '[&>div]:bg-green-500' : '[&>div]:bg-blue-500'}`} />
      </div>

      {feedback && (
        <div className={`rounded-lg p-5 flex items-center gap-4 border-2 ${
          feedback.kind === 'erro' ? 'bg-red-500/10 border-red-500 text-red-400' :
          feedback.kind === 'aviso' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400' :
          'bg-green-500/10 border-green-500 text-green-400'
        }`}>
          {feedback.kind === 'completo' ? <CheckCircle2 className="h-10 w-10 shrink-0" /> : <XCircle className="h-10 w-10 shrink-0" />}
          <div>
            <p className="text-2xl font-bold tracking-wide">{feedback.title}</p>
            {feedback.sub && <p className="text-sm opacity-80 mt-0.5">{feedback.sub}</p>}
          </div>
        </div>
      )}

      <div className={`bg-[#121212] border-2 rounded-lg min-h-[380px] flex flex-col items-center justify-center p-8 text-center transition-colors ${
        feedback?.kind === 'erro' ? 'border-red-500/60' : activeItem ? 'border-blue-500/50' : allComplete ? 'border-green-500/60' : 'border-[#27272A]'
      }`}>
        {activeItem ? (
            <div className="w-full max-w-3xl space-y-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#71717A]">Codigo Interno</p>
            <p className="font-mono text-6xl sm:text-8xl font-bold text-[#F4F4F5] leading-none">
              {activeItem.produto_interno_codigo}
            </p>
            <p className="text-2xl sm:text-3xl text-zinc-300">
              {activeItem.produto_interno_descricao || activeItem.descricao_nfe}
            </p>
            <div className="flex items-end justify-center gap-3">
              <span className="font-mono text-7xl sm:text-8xl font-bold text-[#71717A]">
                {Number(activeItem.quantidade_conferida)}
              </span>
              <span className="font-mono text-4xl text-zinc-500 pb-2">/ {Number(activeItem.quantidade)} {activeItem.unidade}</span>
            </div>
            <Progress value={pctItem} className="h-5 bg-[#1A1A1A] [&>div]:bg-blue-500 max-w-xl mx-auto" />
            <div className="pt-3 border-t border-[#27272A] flex items-center justify-center gap-6 text-zinc-500">
              <span className="font-mono text-lg">Cod. Nota: <span className="text-zinc-300">{activeItem.cprod}</span></span>
              {activeItem.ean && <span className="font-mono text-lg">EAN: <span className="text-zinc-300">{activeItem.ean}</span></span>}
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <button onClick={(e) => { e.stopPropagation(); openAddBarcode(); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600/15 border border-orange-500/40 text-orange-300 rounded-md text-sm hover:bg-orange-600/25 transition-colors">
                <Barcode className="h-4 w-4" /> Adicionar codigo de barras
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleSkip(); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-zinc-700 text-zinc-400 rounded-md text-sm hover:bg-zinc-800 hover:text-zinc-200 transition-colors">
                <SkipForward className="h-4 w-4" /> Pular
              </button>
            </div>
          </div>
        ) : allComplete ? (
          <div className="space-y-5">
            <CheckCircle2 className="h-20 w-20 mx-auto text-green-400" />
            <p className="text-4xl sm:text-5xl font-bold text-green-400">TODOS OS ITENS CONFERIDOS!</p>
            <p className="text-zinc-400 text-lg">Clique em Finalizar para encerrar a conferencia.</p>
            <button onClick={(e) => { e.stopPropagation(); handleFinalize(); }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white text-xl font-semibold rounded-lg hover:bg-green-500 transition-colors">
              <StopCircle className="h-6 w-6" /> Finalizar Conferencia
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <ScanBarcode className="h-20 w-20 mx-auto text-[#71717A] animate-pulse" />
            <p className="text-3xl sm:text-4xl font-bold text-[#F4F4F5]">BIPE UM PRODUTO</p>
            <p className="text-zinc-500 text-lg">Aponte o leitor para o codigo de barras de qualquer produto da nota</p>
          </div>
        )}
      </div>

      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-md p-3 flex items-center gap-3">
        <ScanBarcode className="h-5 w-5 text-[#71717A] shrink-0" />
        <input ref={scannerRef} value={scanValue}
          onChange={e => setScanValue(e.target.value)} onKeyDown={handleScan}
          placeholder="Leitor ativo - bipe o codigo de barras..."
          autoComplete="off"
          className="flex-1 bg-transparent font-mono text-[#101426] focus:outline-none placeholder:text-zinc-500" />
        <span className="text-[10px] uppercase tracking-widest text-green-500">scanner ativo</span>
      </div>

      <div>
        <p className="text-[11px] text-zinc-600 mb-2">Clique em um produto para seleciona-lo e, se precisar, adicionar o codigo de barras que faltou no XML.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {itens.map(item => {
            const complete = item.quantidade > 0 && item.quantidade_conferida >= item.quantidade;
            const partial = !complete && item.quantidade_conferida > 0;
            const active = activeItem?.id === item.id;
            return (
              <button type="button" key={item.id}
                onClick={(e) => { e.stopPropagation(); handleSelectItem(item); }}
                className={`rounded-md border p-2.5 text-left transition-colors hover:border-orange-500/60 ${
                  active ? 'border-blue-500 bg-blue-500/10' :
                  complete ? 'border-green-500/40 bg-green-500/5' :
                  partial ? 'border-yellow-500/40 bg-yellow-500/5' :
                  'border-[#27272A] bg-[#121212]'
                }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm text-[#F4F4F5] truncate">{item.produto_interno_codigo}</span>
                  <span className={`font-mono text-xs shrink-0 ${complete ? 'text-green-400' : partial ? 'text-yellow-400' : 'text-zinc-500'}`}>
                    {Number(item.quantidade_conferida)}/{Number(item.quantidade)}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">{item.produto_interno_descricao || item.descricao_nfe}</p>
              </button>
            );
          })}
        </div>
      </div>

      <Dialog open={addBarcodeOpen} onOpenChange={setAddBarcodeOpen}>
        <DialogContent className="bg-[#121212] border-[#27272A] text-[#F4F4F5] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2"><Barcode className="h-5 w-5 text-orange-400" /> Adicionar codigo de barras</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Bipe o codigo de barras do produto <span className="text-[#F4F4F5] font-mono">{activeItem?.produto_interno_codigo}</span>. Ele sera salvo no cadastro e contara +1 nesta conferencia.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-[11px] uppercase tracking-[0.15em] text-[#71717A] mb-2 block">Codigo de barras</label>
            <input ref={addBarcodeRef} value={addBarcodeValue}
              onChange={e => setAddBarcodeValue(e.target.value)}
              onKeyDown={handleAddBarcode}
              placeholder="Bipe ou digite o codigo..."
              autoComplete="off"
              className="w-full text-lg p-3 bg-black text-white font-mono border-2 border-orange-500/30 rounded-md focus:border-orange-500 focus:outline-none placeholder:text-zinc-700" />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setAddBarcodeOpen(false)}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-[#F4F4F5] transition-colors">Cancelar</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewOpen} onOpenChange={(v) => { if (!finalizing) setReviewOpen(v); }}>
        <DialogContent className="bg-[#121212] border-[#27272A] text-[#F4F4F5] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2"><ClipboardList className="h-5 w-5 text-green-400" /> Revisao final</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Confira as quantidades antes de gerar o relatorio. Nada e gravado ate voce confirmar.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md border border-[#27272A] bg-[#0A0A0A] p-3">
              <p className="text-2xl font-mono font-bold text-[#F4F4F5]">{itens.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1">Itens</p>
            </div>
            <div className="rounded-md border border-green-500/30 bg-green-500/5 p-3">
              <p className="text-2xl font-mono font-bold text-green-400">{revisao.completos}</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1">Conferidos</p>
            </div>
            <div className={`rounded-md border p-3 ${revisao.divergentes.length ? 'border-red-500/30 bg-red-500/5' : 'border-[#27272A] bg-[#0A0A0A]'}`}>
              <p className={`text-2xl font-mono font-bold ${revisao.divergentes.length ? 'text-red-400' : 'text-[#F4F4F5]'}`}>{revisao.divergentes.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1">Divergencias</p>
            </div>
          </div>

          {revisao.divergentes.length > 0 && (
            <div className="max-h-48 overflow-auto rounded-md border border-[#27272A] divide-y divide-[#1A1A1A]">
              {revisao.divergentes.map(it => {
                const diff = Number(it.quantidade_conferida) - Number(it.quantidade);
                return (
                  <div key={it.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="font-mono text-sm text-[#F4F4F5] truncate">{it.produto_interno_codigo}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{it.produto_interno_descricao || it.descricao_nfe}</p>
                    </div>
                    <span className="font-mono text-sm text-red-400 shrink-0">
                      {Number(it.quantidade_conferida)}/{Number(it.quantidade)} ({diff > 0 ? '+' : ''}{diff})
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {scansPendentes > 0 && (
            <p className="text-[11px] text-orange-400 flex items-center gap-1.5">
              <CloudUpload className="h-3.5 w-3.5 animate-pulse" /> {scansPendentes} leitura(s) sendo salva(s). Ao confirmar, aguardaremos o salvamento.
            </p>
          )}

          <div>
            <label className="text-[11px] uppercase tracking-[0.15em] text-[#71717A] mb-2 block">Nome do Estoquista</label>
            <input value={operadorNome} autoFocus
              onChange={e => setOperadorNome(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && operadorNome.trim()) handleConfirmFinalize(); }}
              placeholder="Digite seu nome..."
              className="w-full text-lg p-3 bg-black text-white border-2 border-green-500/20 rounded-md focus:border-green-500 focus:outline-none placeholder:text-zinc-700" />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setReviewOpen(false)} disabled={finalizing}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-[#F4F4F5] transition-colors disabled:opacity-50">Voltar</button>
            <button onClick={handleConfirmFinalize} disabled={!operadorNome.trim() || finalizing}
              className="px-5 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-500 disabled:opacity-50 transition-colors">
              {finalizing ? 'Salvando...' : 'Confirmar e Gerar Relatorio'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Header({ nota, navigate }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => navigate('/conferencia')} className="p-1.5 hover:bg-[#1A1A1A] rounded transition-colors">
        <ArrowLeft className="h-5 w-5 text-zinc-400" />
      </button>
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-[#F4F4F5] tracking-tight">NF-e {nota.numero || '-'}</h1>
        <p className="text-zinc-500 text-sm">{nota.fornecedor_nome} &middot; R$ {nota.valor_total?.toFixed(2)}</p>
      </div>
    </div>
  );
}
