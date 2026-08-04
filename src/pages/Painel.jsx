import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Users, Plus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Painel = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    properties: 0,
    buyers: 0,
  });

  const fetchStats = async () => {
    try {
      // Fetch ALL properties and buyers regardless of creator
      // Using count: 'exact' and head: true for efficiency if we just want the number
      const [propertiesResult, buyersResult] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact', head: true }),
        supabase.from('buyers').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        properties: propertiesResult.count || 0,
        buyers: buyersResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up Realtime subscription for global changes
    const channel = supabase
      .channel('dashboard-global-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'properties' },
        () => {
          fetchStats();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'buyers' },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const cards = [
    {
      title: 'Total de Imóveis',
      value: stats.properties,
      icon: Building2,
      color: 'from-emerald-500 to-teal-500',
      link: '/imoveis',
      action: '/adicionar-imovel',
      actionText: 'Adicionar Imóvel',
    },
    {
      title: 'Total de Compradores',
      value: stats.buyers,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      link: '/compradores',
      action: '/adicionar-comprador',
      actionText: 'Adicionar Comprador',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Painel - L & T Imóbil</title>
        <meta name="description" content="Gerencie seus imóveis e compradores" />
      </Helmet>

      <div className="min-h-screen bg-emerald-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Painel Geral</h1>
            <p className="text-lg text-gray-600">Bem-vindo de volta, {user?.user_metadata?.full_name || 'Usuário'}! Aqui está o resumo geral do sistema.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {cards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <div className={`bg-gradient-to-br ${card.color} p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                      <card.icon className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-4xl font-bold text-white">{card.value}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                </div>
                <div className="p-6 flex gap-3">
                  <Link to={card.link} className="flex-1">
                    <Button variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white">
                      Ver Todos
                    </Button>
                  </Link>
                  <Link to={card.action} className="flex-1">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      {card.actionText}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
          {/* Removed "Ações Rápidas" block as per user request */}
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Painel;