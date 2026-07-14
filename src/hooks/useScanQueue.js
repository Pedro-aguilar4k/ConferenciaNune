import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API } from '@/lib/api';

/**
 * Fila de bipagem durável e não-bloqueante.
 *
 * Objetivo: cada bipagem conta na hora (otimista, feito pelo chamador) e é
 * persistida imediatamente em localStorage. Um worker em segundo plano envia
 * cada leitura ao servidor com um scan_uuid único (idempotente no backend),
 * com retry automático em caso de falha de rede. Assim nenhuma bipagem é
 * perdida — mesmo que o navegador feche/trave — sem travar a fluidez da tela.
 */
export function useScanQueue(notaId, { onResult, onError } = {}) {
  const storageKey = `conferencia:scanqueue:${notaId}`;
  const queueRef = useRef([]);
  const runningRef = useRef(false);
  const [pending, setPending] = useState(0);
  const [syncError, setSyncError] = useState(false);
  // Mantém callbacks atualizados sem reiniciar o worker
  const cbRef = useRef({ onResult, onError });
  cbRef.current = { onResult, onError };

  const persist = useCallback(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(queueRef.current));
    } catch { /* storage cheio/indisponível: segue só em memória */ }
    setPending(queueRef.current.length);
  }, [storageKey]);

  const processNext = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      while (queueRef.current.length > 0) {
        const task = queueRef.current[0];
        try {
          const res = await axios.post(`${API}${task.endpoint}`, task.body);
          // Sucesso: remove da fila e persiste antes de reconciliar a UI
          queueRef.current.shift();
          persist();
          setSyncError(false);
          cbRef.current.onResult?.(res.data, task);
        } catch (err) {
          const status = err?.response?.status;
          if (status && status >= 400 && status < 500) {
            // Erro definitivo do servidor (ex.: nota inexistente): descarta para não travar a fila
            queueRef.current.shift();
            persist();
            cbRef.current.onError?.(err, task);
          } else {
            // Falha de rede/servidor: mantém na fila e tenta de novo (backend é idempotente via scan_uuid)
            setSyncError(true);
            cbRef.current.onError?.(err, task);
            await new Promise(r => setTimeout(r, 1500));
          }
        }
      }
    } finally {
      runningRef.current = false;
    }
  }, [persist]);

  // Recupera fila persistida ao montar (retomada após reload/queda)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length > 0) {
          queueRef.current = saved;
          setPending(saved.length);
          processNext();
        }
      }
    } catch { /* ignore */ }
    // Reenvia ao voltar a conexão
    const onOnline = () => processNext();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [storageKey, processNext]);

  const enqueue = useCallback((task) => {
    queueRef.current.push(task);
    persist();
    processNext();
  }, [persist, processNext]);

  // Resolve quando a fila esvazia (usado antes de finalizar a conferência)
  const flush = useCallback(async () => {
    processNext();
    const start = Date.now();
    while (queueRef.current.length > 0) {
      // aborta espera infinita se ficar mais de 20s offline
      if (Date.now() - start > 20000) throw new Error('timeout');
      await new Promise(r => setTimeout(r, 200));
    }
  }, [processNext]);

  return { enqueue, flush, pending, syncError };
}
