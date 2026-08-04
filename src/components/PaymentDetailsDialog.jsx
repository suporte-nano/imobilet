import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const PaymentDetailsDialog = ({ isOpen, onClose, account, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paidDate, setPaidDate] = useState(account?.paid_date || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(account?.payment_method || '');
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!paidDate) {
      setError('Data de pagamento é obrigatória');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('payable_accounts')
        .update({
          paid: true,
          paid_date: paidDate,
          payment_method: paymentMethod || null
        })
        .eq('id', account.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: 'Pagamento registrado',
        description: 'O pagamento foi registrado com sucesso!',
      });

      onSuccess();
      onClose();

    } catch (err) {
      console.error('Error updating payment:', err);
      toast({
        title: 'Erro ao registrar pagamento',
        description: err.message || 'Não foi possível registrar o pagamento.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Registrar Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Conta:</p>
            <p className="font-semibold text-gray-900">{account?.description}</p>
          </div>

          <div>
            <Label htmlFor="paid_date">
              Data de Pagamento <span className="text-red-500">*</span>
            </Label>
            <Input
              id="paid_date"
              type="date"
              value={paidDate}
              onChange={(e) => {
                setPaidDate(e.target.value);
                setError('');
              }}
              disabled={loading}
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
          </div>

          <div>
            <Label htmlFor="payment_method">Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={loading}>
              <SelectTrigger id="payment_method">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Transferência">Transferência</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                <SelectItem value="Cartão">Cartão</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Confirmar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDetailsDialog;