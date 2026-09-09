// Manajemen user internal (ketua/pengurus/petugas) oleh pengurus — GET/POST/PUT/DELETE /users.
import { useState } from 'react';
import { Eye, Pencil, Search, ShieldCheck, Trash2, UserPlus, Users, X } from 'lucide-react';
import { PageHeader, StatCard, Pager } from '@/Components/Koperasi/ManagerUI';
import { Modal } from '@/Components/Koperasi/Popups';
import { api, useApi, rp, dfmt } from '@/lib/api';

const cn = (...cls) => cls.filter(Boolean).join(' ');

const ROLE_STYLE = {
    ketua: 'bg-purple-100 text-purple-800',
    pengurus: 'bg-blue-100 text-primary',
    petugas: 'bg-emerald-100 text-emerald-700',
    anggota: 'bg-slate-100 text-slate-600',
};

const inputCls = 'h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-foreground transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15';

function UserForm({ user, onDone, onCancel }) {
    const isEdit = Boolean(user?.id);
    const [form, setForm] = useState({
        name: user?.name ?? '', username: user?.username ?? '', email: user?.email ?? '',
        password: '', role: user?.role ?? 'petugas', phone: user?.phone ?? '', address: user?.address ?? '',
    });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            const body = { ...form, password: form.password || undefined };
            const res = isEdit
                ? await api(`/users/${user.id}`, { method: 'PUT', body })
                : await api('/users', { method: 'POST', body });
            onDone(res?.message || 'Akun berhasil disimpan.');
        } catch (err) {
            setError(err.errors ? Object.values(err.errors)[0]?.[0] : err.message);
        } finally { setSaving(false); }
    };

    return (
        <Modal open onClose={onCancel}>
            <div className="flex items-center justify-between bg-accent/60 px-6 py-4 border-b border-border/60">
                <h2 className="flex items-center gap-2.5 text-base font-bold text-primary">
                    <UserPlus size={20} />
                    <span>{isEdit ? `Edit Akun — ${user.name}` : 'Buat Akun Internal'}</span>
                </h2>
                <button type="button" onClick={onCancel} className="rounded-lg p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground">
                    <X size={18} />
                </button>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-4 p-6 bg-card">
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-foreground/80">Nama
                        <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-foreground/80">Role
                        <select required value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={inputCls}>
                            <option value="petugas">Petugas</option>
                            <option value="pengurus">Pengurus</option>
                            <option value="ketua">Ketua</option>
                            <option value="anggota">Anggota</option>
                        </select>
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-foreground/80">Username
                        <input required value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className={inputCls} />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-foreground/80">Email
                        <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
                    </label>
                </div>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-foreground/80">
                    Password {isEdit && <span className="font-normal text-muted-foreground">(kosongkan jika tidak diganti)</span>}
                    <input type="password" minLength={8} required={!isEdit} value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={inputCls} placeholder="Minimal 8 karakter" />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-foreground/80">Telepon
                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-foreground/80">Alamat
                        <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputCls} />
                    </label>
                </div>
                {error && <p className="text-xs font-medium text-destructive">{error}</p>}
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onCancel} className="h-11 flex-1 rounded-xl border border-border bg-card text-sm font-semibold text-foreground/80 hover:bg-secondary">Batal</button>
                    <button type="submit" disabled={saving} className="h-11 flex-[1.5] rounded-xl bg-primary text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-60">
                        {saving ? 'Menyimpan…' : 'Simpan Akun'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default function UsersPage({ showStatus }) {
    const { data, meta, loading, reload } = useApi('/users?per_page=25');
    const [role, setRole] = useState('semua');
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState(null);
    const [detail, setDetail] = useState(null);

    const rows = (data ?? []).filter(u =>
        (role === 'semua' || u.role === role) &&
        (u.name?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase()))
    );
    const counts = r => (data ?? []).filter(u => u.role === r).length;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Manajemen Pengguna"
                desc="Kelola akun internal koperasi: ketua, pengurus, dan petugas lapangan."
                action={
                    <button onClick={() => setEditing({})}
                        className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary/90">
                        <UserPlus size={16} /> <span>Buat Akun</span>
                    </button>
                }
            />

            <div className="grid gap-5 md:grid-cols-3">
                <StatCard icon={ShieldCheck} label="Ketua" value={`${counts('ketua')} akun`} tone="gold" />
                <StatCard icon={Users} label="Pengurus" value={`${counts('pengurus')} akun`} tone="blue" />
                <StatCard icon={Users} label="Petugas" value={`${counts('petugas')} akun`} tone="green" />
            </div>

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center border-b border-border/60">
                    <h2 className="text-lg font-bold text-foreground">Daftar Akun Internal</h2>
                    <div className="flex items-center gap-2">
                        <div className="relative w-full sm:w-64">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama / username…"
                                className="h-9 w-full rounded-xl border border-border bg-slate-50/50 pl-9 pr-3 text-xs focus:bg-white" />
                        </div>
                        <select value={role} onChange={e => setRole(e.target.value)} aria-label="Filter role"
                            className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground focus:bg-white">
                            <option value="semua">Semua Role</option>
                            <option value="ketua">Ketua</option>
                            <option value="pengurus">Pengurus</option>
                            <option value="petugas">Petugas</option>
                            <option value="anggota">Anggota</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-6 py-3.5">Nama & Username</th>
                                <th className="px-6 py-3.5">Email</th>
                                <th className="px-6 py-3.5">Role</th>
                                <th className="px-6 py-3.5">Dibuat</th>
                                <th className="px-6 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading && <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">Memuat data…</td></tr>}
                            {!loading && rows.length === 0 && <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">Tidak ada akun yang cocok.</td></tr>}
                            {rows.map(u => (
                                <tr key={u.id} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="block font-semibold text-foreground">{u.name}</span>
                                        <span className="block font-mono text-[11px] font-bold text-muted-foreground">@{u.username}</span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold uppercase', ROLE_STYLE[u.role])}>{u.role}</span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{dfmt(u.created_at)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => setDetail(u)} aria-label={`Detail ${u.name}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"><Eye size={16} /></button>
                                            <button onClick={() => setEditing(u)} aria-label={`Edit ${u.name}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"><Pencil size={16} /></button>
                                            <button onClick={async () => {
                                                if (!confirm(`Hapus akun ${u.name}? Tindakan ini tidak dapat dibatalkan.`)) return;
                                                try {
                                                    const res = await api(`/users/${u.id}`, { method: 'DELETE' });
                                                    showStatus('Akun Dihapus', res?.message || 'Akun berhasil dihapus.'); reload();
                                                } catch (err) { showStatus('Gagal Menghapus', err.message); }
                                            }} aria-label={`Hapus ${u.name}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-destructive"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/60 bg-slate-50/50 text-xs text-muted-foreground">
                    <span>Menampilkan {rows.length} dari {meta?.total ?? 0} data</span>
                    <Pager total={Math.max(1, Math.ceil((meta?.total ?? 0) / (meta?.per_page ?? 25)))} />
                </div>
            </section>

            {editing && (
                <UserForm user={editing}
                    onCancel={() => setEditing(null)}
                    onDone={(msg) => { setEditing(null); reload(); showStatus('Akun Tersimpan', msg); }} />
            )}

            {detail && (
                <Modal open onClose={() => setDetail(null)}>
                    <div className="flex items-center justify-between bg-accent/60 px-6 py-4 border-b border-border/60">
                        <h2 className="flex items-center gap-2.5 text-base font-bold text-primary"><Users size={20} /><span>Detail Akun</span></h2>
                        <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground"><X size={18} /></button>
                    </div>
                    <div className="grid gap-3 p-6 sm:grid-cols-2 bg-card">
                        {[
                            ['Nama', detail.name], ['Username', `@${detail.username}`], ['Email', detail.email],
                            ['Role', detail.role?.toUpperCase()], ['Telepon', detail.phone ?? '-'], ['Alamat', detail.address ?? '-'],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-xl border border-border/60 bg-slate-50/70 p-3.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                                <p className="mt-1 text-xs font-medium text-foreground">{value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="p-6 pt-0 bg-card">
                        <button onClick={() => setDetail(null)} className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white shadow-sm hover:bg-primary/90">Tutup</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
