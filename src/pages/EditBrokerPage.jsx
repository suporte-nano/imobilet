import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Trash2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BrokerForm from '@/components/BrokerForm';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
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

const EditBrokerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [broker, setBroker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchBroker();
  }, [id]);

  const fetchBroker = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brokers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setBroker(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar corretor',
        description: error.message,
      });
      navigate('/corretores');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('brokers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Corretor excluído',
        description: 'O corretor foi removido com sucesso.',
      });

      navigate('/corretores');
    } catch (error) {
      console.error('Error deleting broker:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: error.message,
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Corretor não encontrado</p>
          <Link to="/corretores">
            <Button className="bg-emerald-600 hover:bg-emerald-700">Voltar para Corretores</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Editar Corretor - {broker.nome_completo} - L & T Imóbil</title>
        <meta name="description" content={`Editar dados do corretor ${broker.nome_completo}`} />
      </Helmet>

      <div className="min-h-screen bg-emerald-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center text-sm text-gray-600 mb-6"
          >
            <Link to="/painel" className="hover:text-emerald-600">Painel</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link to="/corretores" className="hover:text-emerald-600">Corretores</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-emerald-600 font-medium">{broker.nome_completo}</span>
          </motion.div>

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex justify-between items-start"
          >
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Editar Corretor</h1>
              <p className="text-lg text-gray-600">Atualize os dados de {broker.nome_completo}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  disabled={deleting}
                >
                  {deleting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600 mr-2"></div>
                  ) : (
                    <Trash2 className="h-5 w-5 mr-2" />
                  )}
                  Excluir Corretor
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
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>

          {/* Form */}
          <BrokerForm broker={broker} mode="edit" />
        </div>

        <Footer />
      </div>
    </>
  );
};

export default EditBrokerPage;