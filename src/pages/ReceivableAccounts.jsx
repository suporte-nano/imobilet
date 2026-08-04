import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUp,
  CalendarClock,
  CheckCircle2,
  FileText,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UserRoundX,
  WalletCards,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  contractStatusLabels,
  formatCurrency,
  formatDate,
  getInstallmentBadgeClass,
  installmentStatusLabels,
  isMissingReceivablesSchema,
  safeBuyerName,
  safePropertyTitle,
} from '@/lib/receivables';

const statusOptions = [
  ['', 'Todos os status'],
  ['open', 'Em aberto'],
  ['overdue', 'Vencidas'],
  ['partial', 'Parciais'],
  ['paid', 'Pagas'],
  ['cancelled', 'Canceladas'],
  ['renegotiated', 'Renegociadas'],
];

const ReceivableAccounts = () => {
  const { toast } = useToast();
  const [contracts, setContracts] = useState([]);
  const [unlinkedBuyers, setUnlinkedBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setSchemaMissing(false);

      const { data: contractData, error: contractError } = await supabase
        .from('sales_contracts')
        .select(`
          *,
          property:properties(id, title, code, custom_id, status, block, fraction),
          buyer:buyers(id, full_name, name, email, phone),
          installments(*),
          payments(*)
        `)
        .order('sale_date', { ascending: false });

      if (contractError) {
        if (isMissingReceivablesSchema(contractError)) {
          setContracts([]);
          setSchemaMissing(true);
        } else {
          throw contractError;
        }
      } else {
        setContracts(contractData || []);
      }

      const { data: buyerData, error: buyerError } = await supabase
        .from('buyers')
        .select('*')
        .limit(200);

      if (!buyerError) {
        setUnlinkedBuyers((buyerData || []).filter((buyer) => !buyer.property_id));
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar contas a receber',
        description: error.message || 'Não foi possível consultar os contratos e parcelas.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const installments = useMemo(() => contracts.flatMap((contract) => (
    (contract.installments || []).map((installment) => ({
      ...installment,
      contract,
      buyer: contract.buyer,
      property: contract.property,
    }))
  )), [contracts]);

  const filteredInstallments = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const start = filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : null;
    const end = filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : null;

    return installments.filter((installment) => {
      const buyerName = safeBuyerName(installment.buyer).toLowerCase();
      const propertyTitle = safePropertyTitle(installment.property).toLowerCase();
      const contractNumber = String(installment.contract?.contract_number || '').toLowerCase();
      const dueDate = installment.due_date ? new Date(`${installment.due_date}T12:00:00`) : null;

      if (filters.status && installment.status !== filters.status) return false;
      if (search && !buyerName.includes(search) && !propertyTitle.includes(search) && !contractNumber.includes(search)) return false;
      if (start && dueDate && dueDate < start) return false;
      if (end && dueDate && dueDate > end) return false;
      return true;
    }).sort((a, b) => String(a.due_date || '').localeCompare(String(b.due_date || '')));
  }, [filters, installments]);

  const summary = useMemo(() => installments.reduce((acc, item) => {
    const balance = Number(item.balance || 0);
    const paid = Number(item.paid_amount || 0);

    if (!['paid', 'cancelled'].includes(item.status)) acc.open += balance;
    if (item.status === 'overdue') {
      acc.overdue += balance;
      acc.overdueCount += 1;
    }
    acc.received += paid;
    return acc;
  }, {
    open: 0,
    overdue: 0,
    received: 0,
    overdueCount: 0,
  }), [installments]);

  const clearFilters = () => {
    setFilters({ search: '', status: '', startDate: '', endDate: '' });
  };

  return (
    <>
      <Helmet>
        <title>Contas a Receber - Imobilet</title>
        <meta name="description" content="Recebimento de parcelas de imóveis vendidos" />
      </Helmet>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
            <div className="flex items-start gap-4">
              <Link to="/financeiro" className="mt-1 text-slate-500 hover:text-emerald-700 transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <p className="text-sm font-semibold text-emerald-700">Recebimento de parcelas</p>
                <h1 className="text-3xl font-bold text-slate-950 flex items-center">
                  <ArrowUp className="h-8 w-8 text-emerald-600 mr-3" />
                  Contas a Receber
                </h1>
                <p className="text-slate-600 mt-2">
                  Controle contratos de venda, parcelas, inadimplência e pagamentos manuais.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={fetchData} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Link to="/financeiro/a-receber/novo">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white" disabled={schemaMissing}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo contrato
                </Button>
              </Link>
            </div>
          </div>

          {schemaMissing && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <h2 className="font-bold">Migração de recebimentos pendente</h2>
                  <p className="text-sm mt-1">
                    As tabelas `sales_contracts`, `installments`, `payments` e `financial_audit_logs` ainda não existem no Supabase.
                    Aplique a proposta SQL em `docs/supabase-receivables-schema.sql` antes de cadastrar contratos reais.
                  </p>
                </div>
              </div>
            </div>
          )}

          {unlinkedBuyers.length > 0 && (
            <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <UserRoundX className="h-5 w-5 text-slate-500 mt-0.5" />
                <div>
                  <h2 className="font-bold text-slate-950">Compradores sem imóvel vinculado</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {unlinkedBuyers.length} comprador(es) não têm `property_id`. Nenhum contrato será criado automaticamente sem vínculo seguro.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-sm font-medium">Total em aberto</span>
                <WalletCards className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-slate-950">{formatCurrency(summary.open)}</p>
            </div>
            <div className="bg-white border border-rose-100 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between text-rose-600 mb-3">
                <span className="text-sm font-medium">Total vencido</span>
                <CalendarClock className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-rose-700">{formatCurrency(summary.overdue)}</p>
            </div>
            <div className="bg-white border border-emerald-100 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between text-emerald-600 mb-3">
                <span className="text-sm font-medium">Total recebido</span>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(summary.received)}</p>
            </div>
            <div className="bg-white border border-amber-100 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between text-amber-600 mb-3">
                <span className="text-sm font-medium">Parcelas vencidas</span>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-amber-700">{summary.overdueCount}</p>
            </div>
          </div>

          <section className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-slate-950">Filtros e parcelas</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={filters.search}
                    onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                    placeholder="Comprador, imóvel ou contrato"
                    className="pl-9"
                  />
                </div>
                <select
                  value={filters.status}
                  onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-900"
                >
                  {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
                />
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
                />
              </div>
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={clearFilters} className="border-slate-300 text-slate-700 hover:bg-slate-100">
                  Limpar filtros
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
                Carregando parcelas...
              </div>
            ) : filteredInstallments.length === 0 ? (
              <div className="py-20 text-center px-6">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900">Nenhuma parcela encontrada</h3>
                <p className="text-slate-500 mt-2 max-w-md mx-auto">
                  Crie contratos de venda vinculados a imóveis e compradores para gerar a agenda de recebimentos.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px]">
                  <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-5 py-3">Contrato</th>
                      <th className="px-5 py-3">Comprador</th>
                      <th className="px-5 py-3">Imóvel</th>
                      <th className="px-5 py-3">Parcela</th>
                      <th className="px-5 py-3">Vencimento</th>
                      <th className="px-5 py-3">Saldo</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInstallments.map((item) => (
                      <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <Link to={`/financeiro/a-receber/contratos/${item.contract_id}`} className="font-semibold text-emerald-700 hover:underline">
                            {item.contract?.contract_number || '-'}
                          </Link>
                          <p className="text-xs text-slate-500 mt-1">{contractStatusLabels[item.contract?.status] || item.contract?.status}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-700">{safeBuyerName(item.buyer)}</td>
                        <td className="px-5 py-4 text-slate-700">{safePropertyTitle(item.property)}</td>
                        <td className="px-5 py-4 font-medium text-slate-900">{item.installment_number}</td>
                        <td className="px-5 py-4 text-slate-700">{formatDate(item.due_date)}</td>
                        <td className="px-5 py-4 font-bold text-slate-950">{formatCurrency(item.balance)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getInstallmentBadgeClass(item.status)}`}>
                            {installmentStatusLabels[item.status] || item.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link to={`/financeiro/a-receber/contratos/${item.contract_id}`}>
                            <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                              Detalhes
                            </Button>
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ReceivableAccounts;
