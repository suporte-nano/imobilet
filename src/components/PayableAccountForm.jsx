import React, { useState, useEffect } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import PayableDocumentUpload from '@/components/PayableDocumentUpload';

const PayableAccountForm = ({ isOpen, onClose, onSuccess, editData = null }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    holder: '',
    due_date: '',
    available_limit: '',
    used_limit: '',
    amount_to_pay: '',
    agreement: false,
    attachment_url: null,
    paid: false,
    paid_date: '',
    payment_method: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editData) {
      setFormData({
        description: editData.description || '',
        holder: editData.holder || '',
        due_date: editData.due_date || '',
        available_limit: editData.available_limit || '',
        used_limit: editData.used_limit || '',
        amount_to_pay: editData.amount_to_pay || '',
        agreement: editData.agreement || false,
        attachment_url: editData.attachment_url || null,
        paid: editData.paid || false,
        paid_date: editData.paid_date || '',
        payment_method: editData.payment_method || ''
      });
    } else {
      resetForm();
    }
  }, [editData, isOpen]);

  const resetForm = () => {
    setFormData({
      description: '',
      holder: '',
      due_date: '',
      available_limit: '',
      used_limit: '',
      amount_to_pay: '',
      agreement: false,
      attachment_url: null,
      paid: false,
      paid_date: '',
      payment_method: ''
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.holder.trim()) {
      newErrors.holder = 'Titular é obrigatório';
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Data de vencimento é obrigatória';
    }

    if (!formData.amount_to_pay || parseFloat(formData.amount_to_pay) <= 0) {
      newErrors.amount_to_pay = 'Valor a pagar deve ser maior que zero';
    }

    // Validate payment fields when paid is checked
    if (formData.paid && !formData.paid_date) {
      newErrors.paid_date = 'Data de pagamento é obrigatória quando marcado como pago';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, corrija os campos destacados.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        description: formData.description.trim(),
        holder: formData.holder.trim(),
        due_date: formData.due_date,
        available_limit: parseFloat(formData.available_limit) || 0,
        used_limit: parseFloat(formData.used_limit) || 0,
        amount_to_pay: parseFloat(formData.amount_to_pay),
        agreement: formData.agreement,
        attachment_url: formData.attachment_url,
        paid: formData.paid,
        paid_date: formData.paid ? formData.paid_date : null,
        payment_method: formData.paid ? (formData.payment_method || null) : null
      };

      let result;

      if (editData) {
        // Update existing record
        result = await supabase
          .from('payable_accounts')
          .update(payload)
          .eq('id', editData.id)
          .select()
          .single();
      } else {
        // Insert new record
        result = await supabase
          .from('payable_accounts')
          .insert([payload])
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: editData ? 'Conta atualizada' : 'Conta adicionada',
        description: editData 
          ? 'A conta a pagar foi atualizada com sucesso!' 
          : 'A conta a pagar foi adicionada com sucesso!',
      });

      resetForm();
      onSuccess();
      onClose();

    } catch (error) {
      console.error('Error saving payable account:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar a conta a pagar.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Clear payment fields when unchecking paid
      if (field === 'paid' && !value) {
        updated.paid_date = '';
        updated.payment_method = '';
      }
      
      return updated;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {editData ? 'Editar Conta a Pagar' : 'Adicionar Conta a Pagar'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Description */}
            <div className="md:col-span-2">
              <Label htmlFor="description">
                Descrição <span className="text-red-500">*</span>
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Ex: Conta de luz, Fornecedor XYZ"
                disabled={loading}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            {/* Holder */}
            <div className="md:col-span-2">
              <Label htmlFor="holder">
                Titular <span className="text-red-500">*</span>
              </Label>
              <Input
                id="holder"
                value={formData.holder}
                onChange={(e) => handleChange('holder', e.target.value)}
                placeholder="Nome do titular ou empresa"
                disabled={loading}
                className={errors.holder ? 'border-red-500' : ''}
              />
              {errors.holder && (
                <p className="text-sm text-red-500 mt-1">{errors.holder}</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <Label htmlFor="due_date">
                Data de Vencimento <span className="text-red-500">*</span>
              </Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
                disabled={loading}
                className={errors.due_date ? 'border-red-500' : ''}
              />
              {errors.due_date && (
                <p className="text-sm text-red-500 mt-1">{errors.due_date}</p>
              )}
            </div>

            {/* Amount to Pay */}
            <div>
              <Label htmlFor="amount_to_pay">
                Valor a Pagar <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount_to_pay"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount_to_pay}
                onChange={(e) => handleChange('amount_to_pay', e.target.value)}
                placeholder="0.00"
                disabled={loading}
                className={errors.amount_to_pay ? 'border-red-500' : ''}
              />
              {errors.amount_to_pay && (
                <p className="text-sm text-red-500 mt-1">{errors.amount_to_pay}</p>
              )}
            </div>

            {/* Available Limit */}
            <div>
              <Label htmlFor="available_limit">Limite Disponível</Label>
              <Input
                id="available_limit"
                type="number"
                step="0.01"
                min="0"
                value={formData.available_limit}
                onChange={(e) => handleChange('available_limit', e.target.value)}
                placeholder="0.00"
                disabled={loading}
              />
            </div>

            {/* Used Limit */}
            <div>
              <Label htmlFor="used_limit">Limite Usado</Label>
              <Input
                id="used_limit"
                type="number"
                step="0.01"
                min="0"
                value={formData.used_limit}
                onChange={(e) => handleChange('used_limit', e.target.value)}
                placeholder="0.00"
                disabled={loading}
              />
            </div>

            {/* Agreement */}
            <div className="md:col-span-2 flex items-center space-x-2">
              <Checkbox
                id="agreement"
                checked={formData.agreement}
                onCheckedChange={(checked) => handleChange('agreement', checked)}
                disabled={loading}
              />
              <Label htmlFor="agreement" className="cursor-pointer">
                Possui acordo de pagamento
              </Label>
            </div>

            {/* Paid Status */}
            <div className="md:col-span-2 flex items-center space-x-2">
              <Checkbox
                id="paid"
                checked={formData.paid}
                onCheckedChange={(checked) => handleChange('paid', checked)}
                disabled={loading}
              />
              <Label htmlFor="paid" className="cursor-pointer">
                Pago
              </Label>
            </div>

            {/* Conditionally render payment fields when paid is checked */}
            {formData.paid && (
              <>
                {/* Paid Date */}
                <div>
                  <Label htmlFor="paid_date">
                    Data de Pagamento <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="paid_date"
                    type="date"
                    value={formData.paid_date}
                    onChange={(e) => handleChange('paid_date', e.target.value)}
                    disabled={loading}
                    className={errors.paid_date ? 'border-red-500' : ''}
                  />
                  {errors.paid_date && (
                    <p className="text-sm text-red-500 mt-1">{errors.paid_date}</p>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <Label htmlFor="payment_method">Forma de Pagamento</Label>
                  <Select 
                    value={formData.payment_method} 
                    onValueChange={(value) => handleChange('payment_method', value)}
                    disabled={loading}
                  >
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
              </>
            )}

            {/* Attachment */}
            <div className="md:col-span-2">
              <Label>Anexo</Label>
              <PayableDocumentUpload
                value={formData.attachment_url}
                onChange={(url) => handleChange('attachment_url', url)}
                disabled={loading}
              />
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
              type="submit"
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
                  <Save className="mr-2 h-4 w-4" />
                  {editData ? 'Atualizar' : 'Adicionar'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PayableAccountForm;