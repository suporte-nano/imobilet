import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import {
  deriveInstallmentStatus,
  formatCurrency,
  getTodayISO,
  paymentMethodLabels,
} from '@/lib/receivables';

const paymentMethods = Object.entries(paymentMethodLabels);

const ManualPaymentDialog = ({ open, onOpenChange, installment, contractId, onPaymentSaved }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    payment_date: getTodayISO(),
    paid_amount: '',
    payment_method: 'pix',
    receipt_path: '',
    notes: '',
  });

  useEffect(() => {
    if (installment) {
      setFormData({
        payment_date: getTodayISO(),
        paid_amount: String(Number(installment.balance || installment.adjusted_amount || 0).toFixed(2)),
        payment_method: 'pix',
        receipt_path: '',
        notes: '',
      });
    }
  }, [installment]);

  const projected = useMemo(() => {
    const currentPaid = Number(installment?.paid_amount || 0);
    const entered = Number(formData.paid_amount || 0);
    const adjusted = Number(installment?.adjusted_amount || installment?.original_amount || 0);
    const nextPaid = currentPaid + entered;
    return {
      nextPaid,
      nextBalance: Math.max(adjusted - nextPaid, 0),
    };
  }, [formData.paid_amount, installment]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!installment || !contractId) return;

    const paidAmount = Number(formData.paid_amount);
    if (!formData.payment_date) {
      toast({ variant: 'destructive', title: 'Informe a data do pagamento.' });
      return;
    }
    if (!paidAmount || paidAmount <= 0) {
      toast({ variant: 'destructive', title: 'Informe um valor de pagamento válido.' });
      return;
    }

    try {
      setSaving(true);

      const paymentPayload = {
        installment_id: installment.id,
        contract_id: contractId,
        payment_date: formData.payment_date,
        paid_amount: paidAmount,
        payment_method: formData.payment_method,
        receipt_path: formData.receipt_path.trim() || null,
        notes: formData.notes.trim() || null,
        created_by: user?.id || null,
      };

      const { error: paymentError } = await supabase
        .from('payments')
        .insert([paymentPayload]);

      if (paymentError) throw paymentError;

      const nextStatus = deriveInstallmentStatus(installment, projected.nextPaid);
      const { error: installmentError } = await supabase
        .from('installments')
        .update({
          paid_amount: projected.nextPaid,
          balance: projected.nextBalance,
          status: nextStatus,
          paid_at: nextStatus === 'paid' ? formData.payment_date : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', installment.id);

      if (installmentError) throw installmentError;

      await supabase.from('financial_audit_logs').insert([{
        entity_type: 'installment',
        entity_id: installment.id,
        action: 'manual_payment_registered',
        description: `Pagamento manual registrado na parcela ${installment.installment_number}.`,
        metadata: {
          contract_id: contractId,
          paid_amount: paidAmount,
          payment_method: formData.payment_method,
          new_status: nextStatus,
        },
        created_by: user?.id || null,
      }]);

      toast({
        title: 'Pagamento registrado',
        description: 'A parcela foi atualizada com sucesso.',
      });

      onPaymentSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao registrar pagamento',
        description: error.message || 'Não foi possível salvar o pagamento.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar pagamento manual</DialogTitle>
          <DialogDescription>
            Parcela {installment?.installment_number || '-'} com saldo de {formatCurrency(installment?.balance || 0)}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_date">Data do pagamento</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(event) => setFormData((prev) => ({ ...prev, payment_date: event.target.value }))}
                disabled={saving}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="paid_amount">Valor pago</Label>
              <Input
                id="paid_amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.paid_amount}
                onChange={(event) => setFormData((prev) => ({ ...prev, paid_amount: event.target.value }))}
                disabled={saving}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="payment_method">Forma de pagamento</Label>
            <select
              id="payment_method"
              value={formData.payment_method}
              onChange={(event) => setFormData((prev) => ({ ...prev, payment_method: event.target.value }))}
              disabled={saving}
              className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {paymentMethods.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="receipt_path">Comprovante/anexo opcional</Label>
            <div className="relative mt-2">
              <Paperclip className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="receipt_path"
                value={formData.receipt_path}
                onChange={(event) => setFormData((prev) => ({ ...prev, receipt_path: event.target.value }))}
                disabled={saving}
                placeholder="Caminho interno ou referência do comprovante"
                className="pl-9"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Não use URL pública. O upload seguro deve ser ligado depois a um bucket privado do Supabase Storage.
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
              disabled={saving}
              className="mt-2 min-h-24"
              placeholder="Ex: pagamento parcial, acordo, referência do recibo..."
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Saldo após o lançamento: <span className="font-bold text-slate-950">{formatCurrency(projected.nextBalance)}</span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Registrar pagamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualPaymentDialog;
