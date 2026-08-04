import React, { useState, useEffect } from 'react';
import { Edit, Trash2, FileText, Loader2, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import PayableAccountForm from '@/components/PayableAccountForm';
import PaymentDetailsDialog from '@/components/PaymentDetailsDialog';

const PayableAccountsTable = ({ onExpenseStatusChanged }) => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [accountForPayment, setAccountForPayment] = useState(null);
  const [updatingPaidStatus, setUpdatingPaidStatus] = useState({});

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('payable_accounts')
        .select('*')
        .order('due_date', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setAccounts(data || []);
    } catch (err) {
      console.error('Error fetching payable accounts:', err);
      setError('Não foi possível carregar as contas a pagar.');
      toast({
        title: 'Erro ao carregar dados',
        description: err.message || 'Não foi possível carregar as contas a pagar.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleEdit = (account) => {
    setEditingAccount(account);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (account) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;

    try {
      const { error } = await supabase
        .from('payable_accounts')
        .delete()
        .eq('id', accountToDelete.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Conta excluída',
        description: 'A conta a pagar foi excluída com sucesso!',
      });

      fetchAccounts();
    } catch (err) {
      console.error('Error deleting account:', err);
      toast({
        title: 'Erro ao excluir',
        description: err.message || 'Não foi possível excluir a conta a pagar.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAccount(null);
  };

  const handleFormSuccess = () => {
    fetchAccounts();
  };

  const handlePaidToggle = async (account, newPaidStatus) => {
    // If marking as paid and no paid_date exists, open payment dialog
    if (newPaidStatus && !account.paid_date) {
      setAccountForPayment(account);
      setPaymentDialogOpen(true);
      return;
    }

    // If unmarking as paid or paid_date already exists, update directly
    setUpdatingPaidStatus(prev => ({ ...prev, [account.id]: true }));

    try {
      const updatedData = {
        paid: newPaidStatus,
        paid_date: newPaidStatus ? account.paid_date : null,
        payment_method: newPaidStatus ? account.payment_method : null
      };

      const { error } = await supabase
        .from('payable_accounts')
        .update(updatedData)
        .eq('id', account.id);

      if (error) {
        throw error;
      }

      toast({
        title: newPaidStatus ? 'Marcado como pago' : 'Desmarcado como pago',
        description: newPaidStatus 
          ? 'A conta foi marcada como paga.' 
          : 'A conta foi desmarcada como paga.',
      });

      // Notify parent component about status change
      if (onExpenseStatusChanged) {
        onExpenseStatusChanged(account.id, {
          paid: newPaidStatus,
          agreement: account.agreement,
          amount_to_pay: account.amount_to_pay,
          due_date: account.due_date
        });
      }

      fetchAccounts();

    } catch (err) {
      console.error('Error updating paid status:', err);
      toast({
        title: 'Erro ao atualizar',
        description: err.message || 'Não foi possível atualizar o status de pagamento.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingPaidStatus(prev => ({ ...prev, [account.id]: false }));
    }
  };

  const handlePaymentDialogClose = () => {
    setPaymentDialogOpen(false);
    setAccountForPayment(null);
  };

  const handlePaymentDialogSuccess = () => {
    // Notify parent about status change after payment dialog completes
    if (onExpenseStatusChanged && accountForPayment) {
      onExpenseStatusChanged(accountForPayment.id, {
        paid: true,
        agreement: accountForPayment.agreement,
        amount_to_pay: accountForPayment.amount_to_pay,
        due_date: accountForPayment.due_date
      });
    }
    fetchAccounts();
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'R$ 0,00';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button
          onClick={fetchAccounts}
          className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhuma conta cadastrada
        </h3>
        <p className="text-gray-600">
          Clique em "Adicionar Despesa" para começar.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-emerald-600 text-white sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Descrição</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Titular</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Vencimento</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Limite Disponível</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Limite Usado</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Valor a Pagar</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Acordo</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Pago</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Anexo</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account, index) => (
                <tr
                  key={account.id}
                  className={`border-b border-gray-200 transition-colors hover:bg-gray-50 ${
                    account.paid 
                      ? 'bg-emerald-50' 
                      : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-gray-900">{account.description}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{account.holder}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(account.due_date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {formatCurrency(account.available_limit)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {formatCurrency(account.used_limit)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-600 text-right">
                    {formatCurrency(account.amount_to_pay)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Checkbox checked={account.agreement} disabled />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-2">
                      {updatingPaidStatus[account.id] ? (
                        <Loader2 className="h-4 w-4 text-emerald-600 animate-spin" />
                      ) : (
                        <>
                          <Checkbox
                            checked={account.paid}
                            onCheckedChange={(checked) => handlePaidToggle(account, checked)}
                          />
                          {account.paid && (
                            <>
                              <Check className="h-4 w-4 text-emerald-600" />
                              {account.paid_date && (
                                <span className="text-xs text-gray-600 ml-1">
                                  {formatDate(account.paid_date)}
                                </span>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {account.attachment_url ? (
                      <a
                        href={account.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(account)}
                        className="hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(account)}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PayableAccountForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        editData={editingAccount}
      />

      <PaymentDetailsDialog
        isOpen={paymentDialogOpen}
        onClose={handlePaymentDialogClose}
        onSuccess={handlePaymentDialogSuccess}
        account={accountForPayment}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conta "{accountToDelete?.description}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PayableAccountsTable;