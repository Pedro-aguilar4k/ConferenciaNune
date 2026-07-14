import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Pencil, Trash2, Users as UsersIcon, ShieldCheck } from 'lucide-react';

const ROLE_STYLES = {
  admin: 'bg-red-500/15 text-red-400 border-red-500/20',
  gerente: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
  comprador: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  estoquista: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};

const emptyForm = { username: '', nome: '', password: '', role: 'estoquista' };

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const [uRes, rRes] = await Promise.all([
        axios.get(`${API}/usuarios`),
        axios.get(`${API}/roles`),
      ]);
      setUsers(uRes.data);
      setRoles(rRes.data);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ username: u.username, nome: u.nome, password: '', role: u.role });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        const payload = { nome: form.nome, role: form.role };
        if (form.password) payload.password = form.password;
        await axios.put(`${API}/usuarios/${editing.id}`, payload);
        toast.success('Usuário atualizado');
      } else {
        await axios.post(`${API}/usuarios`, form);
        toast.success('Usuário criado');
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao salvar usuário');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      await axios.put(`${API}/usuarios/${u.id}`, { ativo: !u.ativo });
      toast.success(u.ativo ? 'Usuário desativado' : 'Usuário ativado');
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao alterar status');
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Excluir o usuário "${u.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await axios.delete(`${API}/usuarios/${u.id}`);
      toast.success('Usuário excluído');
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erro ao excluir usuário');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-heading text-xl font-semibold text-[#F4F4F5] tracking-tight flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-blue-400" /> Usuários
          </h2>
          <p className="text-sm text-[#71717A] mt-1">Gerencie contas e níveis de acesso do sistema.</p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-500 text-white">
          <UserPlus className="h-4 w-4 mr-2" /> Novo usuário
        </Button>
      </div>

      <div className="bg-[#121212] border border-[#27272A] rounded-md overflow-hidden">
        <div className="p-4 border-b border-[#27272A]">
          <h3 className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">
            {loading ? 'Carregando...' : `${users.length} usuário(s)`}
          </h3>
        </div>
        <div className="divide-y divide-[#27272A]">
          {users.map(u => (
            <div key={u.id} className="p-4 flex items-center gap-4 flex-wrap sm:flex-nowrap">
              <div className="h-9 w-9 rounded-full bg-blue-600/20 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-blue-400">{(u.nome || u.username).charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-[#F4F4F5] truncate">{u.nome}</p>
                  {u.id === currentUser?.id && (
                    <span className="text-[10px] text-zinc-500 border border-[#27272A] rounded px-1.5 py-0.5">você</span>
                  )}
                </div>
                <p className="text-xs text-[#71717A] truncate">@{u.username}</p>
              </div>

              <Badge variant="outline" className={`${ROLE_STYLES[u.role] || ''} border`}>
                {u.role === 'admin' && <ShieldCheck className="h-3 w-3 mr-1" />}
                {u.role_label}
              </Badge>

              <div className="flex items-center gap-2">
                <Switch checked={u.ativo} onCheckedChange={() => toggleActive(u)} disabled={u.id === currentUser?.id} />
                <span className="text-xs text-[#71717A] w-14">{u.ativo ? 'Ativo' : 'Inativo'}</span>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(u)} className="p-2 hover:bg-[#1A1A1A] rounded transition-colors" aria-label="Editar" title="Editar">
                  <Pencil className="h-4 w-4 text-[#A1A1AA]" />
                </button>
                <button onClick={() => handleDelete(u)} disabled={u.id === currentUser?.id}
                  className="p-2 hover:bg-[#1A1A1A] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Excluir" title="Excluir">
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
          {!loading && users.length === 0 && (
            <div className="p-8 text-center text-sm text-[#71717A]">Nenhum usuário cadastrado.</div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#121212] border-[#27272A] text-[#F4F4F5]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
            <DialogDescription className="text-[#71717A]">
              {editing ? 'Atualize os dados e o nível de acesso.' : 'Preencha os dados para criar uma nova conta.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                className="bg-[#0A0A0A] border-[#27272A]" placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Usuário (login)</Label>
              <Input id="username" value={form.username} disabled={!!editing}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="bg-[#0A0A0A] border-[#27272A] disabled:opacity-50" placeholder="ex: joao.silva" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{editing ? 'Nova senha (deixe em branco p/ manter)' : 'Senha'}</Label>
              <Input id="password" type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="bg-[#0A0A0A] border-[#27272A]" placeholder="••••••" />
            </div>
            <div className="space-y-2">
              <Label>Nível de acesso</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="bg-[#0A0A0A] border-[#27272A]">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-[#121212] border-[#27272A] text-[#F4F4F5]">
                  {roles.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[#27272A] bg-transparent hover:bg-[#1A1A1A]">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white">
              {saving ? 'Salvando...' : (editing ? 'Salvar' : 'Criar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
