import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, translateAuthError } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const Register = () => {
  const navigate = useNavigate();
  const { signup, isLoading: contextLoading, error: contextError } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authStatus, setAuthStatus] = useState('');
  const [localError, setLocalError] = useState('');

  const displayError = localError || contextError;
  const loading = isSubmitting || contextLoading;

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (formData.password !== formData.confirmPassword) {
      setLocalError("As senhas não conferem. Verifique e tente novamente.");
      return;
    }
    
    setIsSubmitting(true);
    setAuthStatus('Criando conta...');
    
    const { data, error } = await signup(
      formData.email, 
      formData.password, 
      formData.fullName
    );
    
    if (error) {
      const friendlyMsg = translateAuthError(error);
      setLocalError(friendlyMsg);
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: friendlyMsg,
      });
    } else {
      if (data?.user && !data?.session) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Por favor, verifique seu email para confirmar sua conta antes de fazer login.",
          duration: 6000,
        });
        navigate('/login');
      } else {
        toast({
          title: "Bem-vindo!",
          description: "Sua conta foi criada com sucesso.",
        });
        navigate('/painel');
      }
      
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    }
    
    setIsSubmitting(false);
    setAuthStatus('');
  };

  return (
    <>
      <Helmet>
        <title>Cadastro - L & T Imóbil</title>
        <meta name="description" content="Crie sua conta na L & T Imóbil" />
      </Helmet>

      <div className="min-h-screen bg-emerald-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <img 
                  src="https://horizons-cdn.hostinger.com/af40def5-0bd3-4296-b85b-d06d2baeac14/6c7af20940bda7a715211a778df1fdd6.png" 
                  alt="L & T Imóbil" 
                  className="h-24 w-auto object-contain rounded-xl shadow-sm" 
                />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Criar Conta</h2>
              <p className="text-gray-600">Cadastre-se para começar</p>
            </div>

            {displayError && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start text-red-800">
                <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{displayError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="fullName">Nome Completo</Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Seu nome completo"
                    className={`pl-10 text-gray-900 ${displayError ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    className={`pl-10 text-gray-900 ${displayError ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`pl-10 text-gray-900 ${displayError ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`pl-10 text-gray-900 ${displayError ? 'border-red-300 focus-visible:ring-red-500' : ''}`}
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg flex items-center justify-center transition-all disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    {authStatus || 'Carregando...'}
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                  Faça login
                </Link>
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm">
                Voltar para o início
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Register;