import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import PaymentDetailsDialog from '@/components/PaymentDetailsDialog';

const UpcomingExpensesSummary = ({ onExpenseClick, refreshTrigger }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [overdueExpenses, setOverdueExpenses] = useState([]);
  const [upcomingExpenses, setUpcomingExpenses] = useState([]);
  const [totalOverdue, setTotalOverdue] = useState(0);
  const [totalUpcoming, setTotalUpcoming] = useState(0);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const fetchExpenses = async (showToast = false) => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      const fifteenDaysFromNow = new Date(today);
      fifteenDaysFromNow.setDate(today.getDate() + 15);
      const fifteenDaysStr = fifteenDaysFromNow.toISOString().split('T')[0];

      // Fetch overdue accounts
      const { data: overdueData, error: overdueError } = await supabase
        .from('payable_accounts')
        .select('*')
        .eq('paid', false)
        .eq('agreement', false)
        .lt('due_date', todayStr)
        .order('due_date', { ascending: true });

      if (overdueError) throw overdueError;

      // Fetch upcoming accounts (next 15 days, excluding today)
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const { data: upcomingData, error: upcomingError } = await supabase
        .from('payable_accounts')
        .select('*')
        .eq('paid', false)
        .eq('agreement', false)
        .gte('due_date', tomorrowStr)
        .lte('due_date', fifteenDaysStr)
        .order('due_date', { ascending: true });

      if (upcomingError) throw upcomingError;

      const newOverdue = overdueData || [];
      const newUpcoming = upcomingData || [];

      setOverdueExpenses(newOverdue);
      setUpcomingExpenses(newUpcoming);

      const overdueTotal = newOverdue.reduce((sum, expense) => {
        return sum + parseFloat(expense.amount_to_pay || 0);
      }, 0);
      setTotalOverdue(overdueTotal);

      const upcomingTotal = newUpcoming.reduce((sum, expense) => {
        return sum + parseFloat(expense.amount_to_pay || 0);
      }, 0);
      setTotalUpcoming(upcomingTotal);

    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: 'Erro ao carregar despesas',
        description: 'Não foi possível carregar as despesas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses(false);
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchExpenses(true);
    }
  }, [refreshTrigger]);

  useEffect(() => {
    const channel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payable_accounts' },
        () => {
          fetchExpenses(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const getDaysOverdue = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString + 'T00:00:00');
    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleExpenseClick = (expense) => {
    setSelectedExpense(expense);
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = () => {
    fetchExpenses(true);
    setShowPaymentDialog(false);
    setSelectedExpense(null);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayedOverdue = overdueExpenses.slice(0, 5);
  const hasMoreOverdue = overdueExpenses.length > 5;

  const displayedUpcoming = upcomingExpenses.slice(0, 5);
  const hasMoreUpcoming = upcomingExpenses.length > 5;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OVERDUE SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300 shadow-lg h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-600 p-3 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Contas Vencidas
                    </CardTitle>
                    {overdueExpenses.length > 0 && (
                      <motion.p 
                        className="text-sm text-gray-700 mt-1"
                        key={overdueExpenses.length}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <span className="font-semibold">{overdueExpenses.length}</span> {overdueExpenses.length === 1 ? 'conta' : 'contas'} • Total: <span className="font-bold text-red-700">{formatCurrency(totalOverdue)}</span>
                      </motion.p>
                    )}
                  </div>
                </div>
                {overdueExpenses.length > 0 && (
                  <AlertCircle className="h-8 w-8 text-red-600 animate-pulse" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {overdueExpenses.length === 0 ? (
                <motion.div 
                  className="text-center py-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                  <p className="text-gray-700 text-lg font-medium">
                    Nenhuma conta vencida
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    Todas as suas contas estão em dia! 🎉
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {displayedOverdue.map((expense) => {
                      const daysOverdue = getDaysOverdue(expense.due_date);

                      return (
                        <motion.div
                          key={expense.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0 }}
                          transition={{ 
                            opacity: { duration: 0.2 },
                            x: { duration: 0.3 },
                            height: { duration: 0.3 },
                            layout: { duration: 0.3 }
                          }}
                          onClick={() => handleExpenseClick(expense)}
                          className="bg-white rounded-lg p-4 border-l-4 border-red-600 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-semibold text-gray-900">{expense.description}</h4>
                                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded">
                                  VENCIDA
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{expense.holder}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-xs font-medium text-red-600">
                                  {daysOverdue} {daysOverdue === 1 ? 'dia' : 'dias'} atrás
                                </span>
                                <span className="text-xs text-gray-500">
                                  Venceu em {formatDate(expense.due_date)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-lg font-bold text-red-600">
                                {formatCurrency(expense.amount_to_pay)}
                              </p>
                              <ChevronRight className="h-4 w-4 text-gray-400 mt-1 ml-auto" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {hasMoreOverdue && (
                    <motion.div 
                      className="text-center pt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Ver todas ({overdueExpenses.length})
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* UPCOMING SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 shadow-lg h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-600 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      A Vencer (15 dias)
                    </CardTitle>
                    {upcomingExpenses.length > 0 && (
                      <motion.p 
                        className="text-sm text-gray-700 mt-1"
                        key={upcomingExpenses.length}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <span className="font-semibold">{upcomingExpenses.length}</span> {upcomingExpenses.length === 1 ? 'conta' : 'contas'} • Total: <span className="font-bold text-amber-700">{formatCurrency(totalUpcoming)}</span>
                      </motion.p>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingExpenses.length === 0 ? (
                <motion.div 
                  className="text-center py-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Clock className="h-12 w-12 text-amber-400 mx-auto mb-3" />
                  <p className="text-gray-700 text-lg font-medium">
                    Nenhuma conta a vencer nos próximos 15 dias
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    Você está tranquilo! ✨
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {displayedUpcoming.map((expense) => {
                      return (
                        <motion.div
                          key={expense.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0 }}
                          transition={{ 
                            opacity: { duration: 0.2 },
                            x: { duration: 0.3 },
                            height: { duration: 0.3 },
                            layout: { duration: 0.3 }
                          }}
                          onClick={() => handleExpenseClick(expense)}
                          className="bg-white rounded-lg p-4 border-l-4 border-amber-600 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{expense.description}</h4>
                              <p className="text-sm text-gray-600">{expense.holder}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-xs font-medium text-amber-600">
                                  Vence em {formatDate(expense.due_date)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-lg font-bold text-amber-600">
                                {formatCurrency(expense.amount_to_pay)}
                              </p>
                              <ChevronRight className="h-4 w-4 text-gray-400 mt-1 ml-auto" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {hasMoreUpcoming && (
                    <motion.div 
                      className="text-center pt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-600 border-amber-300 hover:bg-amber-50"
                      >
                        Ver todas ({upcomingExpenses.length})
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Payment Details Dialog */}
      {selectedExpense && (
        <PaymentDetailsDialog
          isOpen={showPaymentDialog}
          onClose={() => {
            setShowPaymentDialog(false);
            setSelectedExpense(null);
          }}
          account={selectedExpense}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default UpcomingExpensesSummary;