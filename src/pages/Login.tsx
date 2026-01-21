
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('medico');
    const [name, setName] = useState(''); // Optional: Capture name for better UX?

    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                // Navigation happens via AuthContext listener or we can force it here
                navigate('/');
            } else {
                // SignUp
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            role: role,
                            name: name // Match the trigger expectation (was full_name)
                        }
                    }
                });
                if (error) throw error;
                alert('Conta criada com sucesso! Verifique seu email para confirmar.');
                setIsLogin(true);
            }
        } catch (err: any) {
            console.error('Auth error:', err);
            setError(`Erro ao criar conta: ${err.message || JSON.stringify(err)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-fade-in">
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold tracking-tighter text-foreground mb-2">
                            Agenda<span className="text-primary">+</span>
                        </h1>
                        <p className="text-muted-foreground">
                            {isLogin ? 'Entre na sua conta para continuar' : 'Crie sua conta profissional'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-6 border border-destructive/20">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        {!isLogin && (
                            <Input
                                label="Nome Completo"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Seu nome"
                                required
                            />
                        )}

                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                        />

                        <Input
                            label="Senha"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />

                        {!isLogin && (
                            <Select
                                label="Cargo / Função"
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                options={[
                                    { value: 'medico', label: 'Médico(a)' },
                                    { value: 'enfermeiro', label: 'Enfermeiro(a)' },
                                    { value: 'tecnico', label: 'Técnico(a)' }
                                ]}
                            />
                        )}

                        <Button
                            type="submit"
                            className="w-full mt-2"
                            isLoading={loading}
                        >
                            {isLogin ? 'Entrar' : 'Criar Conta'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-muted-foreground">
                            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                        </span>
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(null); }}
                            className="ml-2 font-semibold text-primary hover:underline focus:outline-none"
                        >
                            {isLogin ? 'Cadastre-se' : 'Entrar'}
                        </button>
                    </div>
                </div>

                {/* Visual Footer */}
                <div className="bg-secondary/20 p-4 text-center text-xs text-muted-foreground border-t border-border">
                    Agenda+ System • v1.4
                </div>
            </div>
        </div>
    );
}
