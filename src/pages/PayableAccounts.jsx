import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowLeft, Plus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import PayableAccountsTable from '@/components/PayableAccountsTable';
import PayableAccountForm from '@/components/PayableAccountForm';
import UpcomingExpensesSummary from '@/components/UpcomingExpensesSummary';

const PayableAccounts = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleExpenseClick = (expense) => {
    setEditingAccount(expense);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAccount(null);
  };

  const handleExpenseStatusChanged = (expenseId, expenseData) => {
    // Increment refresh trigger to notify UpcomingExpensesSummary
    // This will trigger a re-fetch and update of the summary
    setRefreshTrigger(prev => prev + 1);
    
    console.log('Expense status changed:', {
      id: expenseId,
      paid: expenseData.paid,
      agreement: expenseData.agreement,
      amount_to_pay: expenseData.amount_to_pay,
      due_date: expenseData.due_date
    });
  };

  return (
    <>
      <Helmet>
        <title>Contas à Pagar - L & T Imóbil</title>
        <meta name="description" content="Gerenciamento de contas à pagar da L & T Imobiliária" />
      </Helmet>

      <div className="min-h-screen bg-emerald-50 flex flex-col">
        <Navbar />

        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Link to="/financeiro" className="mr-4 text-gray-500 hover:text-emerald-600 transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ArrowDown className="h-8 w-8 text-red-500 mr-3" />
                Contas à Pagar
              </h1>
            </div>
            <Button
              onClick={() => {
                setEditingAccount(null);
                setIsFormOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Despesa
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <UpcomingExpensesSummary 
              onExpenseClick={handleExpenseClick}
              refreshTrigger={refreshTrigger}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <PayableAccountsTable 
              onExpenseStatusChanged={handleExpenseStatusChanged}
            />
          </motion.div>
        </div>

        <Footer />
      </div>

      <PayableAccountForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={() => {
          setRefreshTrigger(prev => prev + 1);
        }}
        editData={editingAccount}
      />
    </>
  );
};

export default PayableAccounts;