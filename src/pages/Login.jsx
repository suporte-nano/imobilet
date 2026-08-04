import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, translateAuthError } from '@/contexts/SupabaseAuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading: contextLoading, error: contextError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    
    if (!formData.email || !formData.password) {
      setLocalError('Por favor, preencha email e senha.');
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await login(formData.email, formData.password);
    
    if (error) {
      setLocalError(translateAuthError(error));
    } else {
      setFormData({ email: '', password: '' });
      navigate('/painel');
    }
    
    setIsSubmitting(false);
  };

  return (
    <>
      <Helmet>
        <title>Login - L & T Imóbil</title>
        <meta name="description" content="Faça login na sua conta L & T Imóbil" />
      </Helmet>

      <div className="min-h-screen bg-emerald-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
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
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Acesso Administrativo</h2>
              <p className="text-gray-600">Entre com suas credenciais para gerenciar a plataforma</p>
            </div>

            {displayError && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start text-red-800">
                <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{displayError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg flex items-center justify-center transition-all disabled:opacity-70 shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <Link to="/" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center justify-center">
                Voltar para a página inicial
              </Link>
            </div>
          </div>
          
          <p className="text-center text-gray-400 text-xs mt-6">
            &copy; {new Date().getFullYear()} L & T Imóbil. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default Login;