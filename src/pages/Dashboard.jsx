import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Users, Plus, TrendingUp, DollarSign } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FinancialSummary from '@/components/FinancialSummary';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    properties: 0,
    buyers: 0,
  });

  const fetchStats = async () => {
    if (!user) return;
    
    try {
      const [propertiesResult, buyersResult] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact' }).eq('created_by', user.id),
        supabase.from('buyers').select('id', { count: 'exact' }).eq('created_by', user.id),
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

    // Set up Realtime subscription
    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'properties' },
        (payload) => {
          // Re-fetch stats when any change occurs in properties
          // Ideally we check if the change affects the current user, but re-fetching is safer and simple
          fetchStats();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'buyers' },
        (payload) => {
          // Re-fetch stats when any change occurs in buyers
          fetchStats();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const cards = [
    {
      title: 'Imóveis',
      value: stats.properties,
      icon: Building2,
      color: 'from-emerald-500 to-teal-500',
      link: '/imoveis',
      action: '/adicionar-imovel',
      actionText: 'Adicionar Imóvel',
    },
    {
      title: 'Compradores',
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
        <title>Dashboard - L & T Imóbil</title>
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-lg text-gray-600">Bem-vindo de volta! Gerencie suas informações aqui.</p>
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center mb-6">
              <DollarSign className="h-7 w-7 text-emerald-600 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">Resumo Financeiro</h2>
            </div>
            <FinancialSummary />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg p-8 text-white"
          >
            <div className="flex items-center mb-4">
              <TrendingUp className="h-8 w-8 mr-3" />
              <h2 className="text-2xl font-bold">Ações Rápidas</h2>
            </div>
            <p className="text-emerald-100 mb-6">
              Gerencie seus imóveis e compradores de forma rápida e eficiente
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/adicionar-imovel">
                <Button className="w-full bg-white text-emerald-600 hover:bg-emerald-50">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Imóvel
                </Button>
              </Link>
              <Link to="/adicionar-comprador">
                <Button className="w-full bg-white text-emerald-600 hover:bg-emerald-50">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Comprador
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Dashboard;