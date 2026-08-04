import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Plus, ArrowLeft, Mail, Phone, Shield, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const BrokersPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchBrokers();
  }, []);

  const fetchBrokers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('brokers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBrokers(data || []);
    } catch (error) {
      console.error('Error fetching brokers:', error);
      setError(error.message);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar corretores',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (brokerId) => {
    try {
      setDeletingId(brokerId);
      const { error } = await supabase
        .from('brokers')
        .delete()
        .eq('id', brokerId);

      if (error) throw error;

      toast({
        title: 'Corretor removido',
        description: 'Corretor excluído com sucesso.',
      });

      fetchBrokers();
    } catch (error) {
      console.error('Error deleting broker:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: error.message,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Ativo':
        return 'bg-emerald-100 text-emerald-800';
      case 'Inativo':
        return 'bg-gray-100 text-gray-800';
      case 'Suspenso':
        return 'bg-red-100 text-red-800';
      case 'Em processo':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Helmet>
        <title>Corretores - L & T Imóbil</title>
        <meta name="description" content="Gerencie os corretores cadastrados no sistema" />
      </Helmet>

      <div className="min-h-screen bg-emerald-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <Link to="/painel">
                <Button variant="ghost" className="mb-4 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Painel
                </Button>
              </Link>
              <h1 className="text-4xl font-bold text-gray-900">Corretores</h1>
              <p className="text-lg text-gray-600 mt-2">Gerencie todos os corretores do sistema</p>
            </div>
            <Link to="/corretores/novo">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-5 w-5 mr-2" />
                Novo Corretor
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 bg-white rounded-xl shadow-lg"
            >
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <p className="text-xl text-gray-600 mb-6">Erro ao carregar corretores</p>
              <p className="text-sm text-gray-500 mb-6">{error}</p>
              <Button
                onClick={fetchBrokers}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Tentar Novamente
              </Button>
            </motion.div>
          ) : brokers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 bg-white rounded-xl shadow-lg"
            >
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600 mb-6">Nenhum corretor cadastrado</p>
              <Link to="/corretores/novo">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="h-5 w-5 mr-2" />
                  Cadastrar Primeiro Corretor
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-emerald-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-emerald-800 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-emerald-800 uppercase tracking-wider">
                        CPF
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-emerald-800 uppercase tracking-wider">
                        CRECI
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-emerald-800 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-emerald-800 uppercase tracking-wider">
                        Telefone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-emerald-800 uppercase tracking-wider">
                        Situação
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-emerald-800 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {brokers.map((broker, index) => (
                      <motion.tr
                        key={broker.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{broker.nome_completo}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{broker.cpf || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{broker.creci_numero || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            {broker.email_profissional ? (
                              <>
                                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                {broker.email_profissional}
                              </>
                            ) : (
                              '-'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            {broker.telefone ? (
                              <>
                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                {broker.telefone}
                              </>
                            ) : (
                              '-'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {broker.creci_situacao ? (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(broker.creci_situacao)}`}>
                              {broker.creci_situacao}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Link to={`/corretores/${broker.id}/editar`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                              >
                                Editar
                              </Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                                  disabled={deletingId === broker.id}
                                >
                                  {deletingId === broker.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o corretor <strong>{broker.nome_completo}</strong>? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(broker.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
};

export default BrokersPage;