import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';

const FinancialSummary = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState({
    totalUnpaid: 0,
    totalPaid: 0,
    overdueCount: 0,
    upcomingCount: 0,
  });

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payable_accounts')
        .select('*');

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const fiveDaysFromNow = new Date(today);
      fiveDaysFromNow.setDate(today.getDate() + 5);

      let totalUnpaid = 0;
      let totalPaid = 0;
      let overdueCount = 0;
      let upcomingCount = 0;

      data.forEach(account => {
        const dueDate = new Date(account.due_date + 'T00:00:00');
        
        if (account.paid) {
          totalPaid += parseFloat(account.amount_to_pay || 0);
        } else {
          totalUnpaid += parseFloat(account.amount_to_pay || 0);
          
          // Check if overdue
          if (dueDate < today) {
            overdueCount++;
          }
          
          // Check if upcoming (within 5 days)
          if (dueDate >= today && dueDate <= fiveDaysFromNow) {
            upcomingCount++;
          }
        }
      });

      setFinancialData({
        totalUnpaid,
        totalPaid,
        overdueCount,
        upcomingCount,
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();

    // Set up Realtime subscription
    const channel = supabase
      .channel('financial-summary-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payable_accounts' },
        () => {
          fetchFinancialData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const cards = [
    {
      title: 'Total de Despesas (À Pagar)',
      value: formatCurrency(financialData.totalUnpaid),
      icon: DollarSign,
      iconColor: 'text-red-600',
      bgColor: 'from-red-500 to-rose-500',
      tooltip: `Total de despesas não pagas: ${formatCurrency(financialData.totalUnpaid)}`,
      clickable: false,
    },
    {
      title: 'Total Pago',
      value: formatCurrency(financialData.totalPaid),
      icon: CheckCircle,
      iconColor: 'text-emerald-600',
      bgColor: 'from-emerald-500 to-teal-500',
      tooltip: `Total de despesas pagas: ${formatCurrency(financialData.totalPaid)}`,
      clickable: false,
    },
    {
      title: 'Despesas Vencidas',
      value: financialData.overdueCount,
      icon: AlertCircle,
      iconColor: 'text-red-600',
      bgColor: 'from-red-500 to-rose-500',
      tooltip: `${financialData.overdueCount} ${financialData.overdueCount === 1 ? 'despesa vencida' : 'despesas vencidas'}`,
      clickable: true,
      link: '/financeiro/a-pagar?filter=overdue',
      badge: financialData.overdueCount > 0 ? '!' : null,
    },
    {
      title: 'Despesas Próximas (5 dias)',
      value: financialData.upcomingCount,
      icon: Clock,
      iconColor: 'text-amber-600',
      bgColor: 'from-amber-500 to-orange-500',
      tooltip: `${financialData.upcomingCount} ${financialData.upcomingCount === 1 ? 'despesa vencendo' : 'despesas vencendo'} nos próximos 5 dias`,
      clickable: true,
      link: '/financeiro/a-pagar?filter=upcoming',
      badge: financialData.upcomingCount > 0 ? 'Atenção' : null,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <TooltipProvider key={index}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => card.clickable && navigate(card.link)}
                className={card.clickable ? 'cursor-pointer' : ''}
              >
                <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className={`bg-gradient-to-br ${card.bgColor} p-6`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                        <card.icon className="h-8 w-8 text-white" />
                      </div>
                      {card.badge && (
                        <Badge variant="destructive" className="bg-white text-red-600 font-bold">
                          {card.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">{card.value}</span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-gray-700">{card.title}</h3>
                  </CardContent>
                </Card>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{card.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
};

export default FinancialSummary;