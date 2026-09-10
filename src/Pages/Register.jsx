import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Head } from '@/lib/shims';
import { api } from '@/lib/api';
import { Building2, Leaf, UserRound, LockKeyhole, Mail, Phone, MapPin, UserPlus } from 'lucide-react';

const inputIcon = 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground';
const inputBase = 'h-12 w-full rounded-xl border border-input/80 bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

function Field({ id, label, icon: Icon, ...props }) {
    return (
        <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground" htmlFor={id}>
            {label}
            <span className="relative block">
                <Icon size={17} className={inputIcon} />
                <input id={id} className={inputBase} {...props} />
            </span>
        </label>
    );
}

function RegisterCard() {
    const [form, setForm] = useState({
        name: '', username: '', email: '', phone: '',
        address: '', member_types: ['rumah'], password: '', password_confirmation: '',
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [done, setDone] = useState(false);
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
    // Kategori anggota (rumah/pasar) — minimal satu, boleh keduanya.
    const toggleType = (t) => setForm(f => ({
        ...f,
        member_types: f.member_types.includes(t)
            ? f.member_types.filter(c => c !== t)
            : [...f.member_types, t],
    }));

    async function handleSubmit(e) {
        e.preventDefault();
        setErrors({});
        setProcessing(true);
        try {
            await api('/auth/register-member', { method: 'POST', body: form });
            setDone(true);
        } catch (err) {
            setErrors(err.errors ?? {});
        } finally {
            setProcessing(false);
        }
    }

    if (done) {
        return (
            <section className="w-full max-w-[500px] rounded-3xl border border-border/60 bg-card px-6 py-8 text-center">
                <UserRound className="mx-auto size-12 text-primary" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">Registrasi Berhasil</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Akun Anda menunggu verifikasi pengurus koperasi sebelum dapat login.
                </p>
                <Link to="/login"
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90">
                    Kembali ke Login
                </Link>
            </section>
        );
    }

    return (
        <section className="w-full max-w-[500px] rounded-3xl border border-border/60 bg-card px-6 py-7">
            <header className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo Koperasi" className="size-12 shrink-0 object-contain" />
                <h2 className="truncate text-base font-semibold text-primary md:text-lg">Daftar Anggota Baru</h2>
            </header>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
                <Field id="name" label="Nama Lengkap" icon={UserRound}
                    value={form.name} onChange={set('name')} required autoComplete="name" placeholder="Nama sesuai KTP" />
                {errors.name && <p role="alert" className="-mt-2 text-xs font-medium text-destructive">{errors.name[0]}</p>}

                <Field id="username" label="Username" icon={UserRound}
                    value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))}
                    required autoComplete="username" placeholder="huruf kecil, angka, titik" />
                {errors.username && <p role="alert" className="-mt-2 text-xs font-medium text-destructive">{errors.username[0]}</p>}

                <Field id="email" label="Email" icon={Mail} type="email"
                    value={form.email} onChange={set('email')} required autoComplete="email" placeholder="nama@email.com" />
                {errors.email && <p role="alert" className="-mt-2 text-xs font-medium text-destructive">{errors.email[0]}</p>}

                <Field id="phone" label="No. Telepon" icon={Phone} type="tel" inputMode="tel"
                    value={form.phone} onChange={set('phone')} required autoComplete="tel" placeholder="08xxxxxxxxxx" />
                {errors.phone && <p role="alert" className="-mt-2 text-xs font-medium text-destructive">{errors.phone[0]}</p>}

                <div className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                    <span id="member_types-label">Jenis Anggota <span className="text-xs font-normal text-muted-foreground">(minimal satu, boleh keduanya)</span></span>
                    <div className="flex gap-2" role="group" aria-labelledby="member_types-label">
                        {[['rumah', 'Rumah'], ['pasar', 'Pasar']].map(([t, label]) => (
                            <label key={t} className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-input/80 bg-background px-3.5 py-3 text-sm font-semibold text-foreground transition-all has-[:checked]:border-primary has-[:checked]:bg-accent has-[:checked]:text-primary">
                                <input
                                    type="checkbox"
                                    checked={form.member_types.includes(t)}
                                    onChange={() => toggleType(t)}
                                    className="accent-primary"
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                    <span className="text-xs text-muted-foreground">Menentukan lokasi penjemputan sampah Anda.</span>
                </div>
                {errors.member_types && <p role="alert" className="-mt-2 text-xs font-medium text-destructive">{errors.member_types[0]}</p>}

                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground" htmlFor="address">
                    Alamat
                    <span className="relative block">
                        <MapPin size={17} className={inputIcon} />
                        <textarea id="address" rows={2} value={form.address} onChange={set('address')} required
                            placeholder="RT / RW / Dusun"
                            className="w-full rounded-xl border border-input/80 bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none" />
                    </span>
                </label>
                {errors.address && <p role="alert" className="-mt-2 text-xs font-medium text-destructive">{errors.address[0]}</p>}

                <Field id="password" label="Password" icon={LockKeyhole} type="password"
                    value={form.password} onChange={set('password')} required autoComplete="new-password" placeholder="Minimal 8 karakter" />
                {errors.password && <p role="alert" className="-mt-2 text-xs font-medium text-destructive">{errors.password[0]}</p>}

                <Field id="password_confirmation" label="Konfirmasi Password" icon={LockKeyhole} type="password"
                    value={form.password_confirmation} onChange={set('password_confirmation')} required autoComplete="new-password" placeholder="Ulangi password" />

                <button type="submit" disabled={processing}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-semibold text-white shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5 disabled:opacity-60">
                    {processing ? 'Memproses...' : 'Daftar'} {!processing && <UserPlus size={18} />}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                    Sudah punya akun?{' '}
                    <Link to="/login" className="font-semibold text-primary hover:underline">Masuk di sini</Link>
                </p>
            </form>
        </section>
    );
}

export default function Register() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 md:px-8">
            <Head title="Daftar Anggota" />
            <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
                <section className="flex w-full max-w-[500px] flex-col items-start">
                    <h1 className="mt-8 max-w-[480px] text-balance text-3xl font-semibold leading-snug tracking-tight text-foreground md:text-[36px]">
                        Jadi Bagian<br />
                        <span className="text-primary">Koperasi Kita.</span>
                    </h1>
                    <p className="mt-4 max-w-[480px] text-pretty text-base leading-relaxed text-muted-foreground">
                        Daftarkan diri Anda sebagai anggota untuk ikut menabung sampah dan menikmati hasilnya.
                    </p>
                    <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
                        <div className="flex min-h-36 flex-1 flex-col items-start justify-center gap-2 rounded-xl border border-border bg-secondary px-5 py-4">
                            <Building2 className="text-primary" size={24} strokeWidth={2.1} />
                            <h2 className="text-sm font-semibold text-foreground">Simpanan Aman</h2>
                            <p className="text-xs leading-5 text-muted-foreground">Setiap setoran sampah tercatat dan bisa dicairkan.</p>
                        </div>
                        <div className="flex min-h-36 flex-1 flex-col items-start justify-center gap-2 rounded-xl border border-border bg-secondary px-5 py-4">
                            <Leaf className="text-success" size={24} strokeWidth={2.1} />
                            <h2 className="text-sm font-semibold text-foreground">Lingkungan Sehat</h2>
                            <p className="text-xs leading-5 text-muted-foreground">Sampah Anda diolah menjadi nilai ekonomi.</p>
                        </div>
                    </div>
                </section>

                <RegisterCard />
            </div>
        </main>
    );
}
