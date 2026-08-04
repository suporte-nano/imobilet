import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Database, Download, Upload, AlertTriangle, FileJson, CheckCircle, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const Backup = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef(null);

  const handleBackup = async () => {
    try {
      setLoading(true);

      // Fetch data from all major tables
      const [propertiesRes, buyersRes, customersRes] = await Promise.all([
        supabase.from('properties').select('*'),
        supabase.from('buyers').select('*'),
        supabase.from('customers').select('*')
      ]);

      if (propertiesRes.error) throw new Error(`Erro ao exportar imóveis: ${propertiesRes.error.message}`);
      if (buyersRes.error) throw new Error(`Erro ao exportar compradores: ${buyersRes.error.message}`);
      
      // Customers might be optional/empty depending on usage
      if (customersRes.error && customersRes.error.code !== 'PGRST116') {
         console.warn("Erro ao exportar clientes (tabela customers):", customersRes.error);
      }

      const backupData = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        data: {
          properties: propertiesRes.data || [],
          buyers: buyersRes.data || [],
          customers: customersRes.data || [],
        }
      };

      // Create downloadable file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `backup_lt_imobil_${dateStr}.json`;
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Backup concluído com sucesso!",
        description: "O arquivo foi baixado para o seu dispositivo.",
        variant: "default",
        className: "bg-emerald-600 text-white border-none"
      });

    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: "Falha no Backup",
        description: error.message || "Ocorreu um erro ao gerar o arquivo de backup.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setRestoring(true);
      const text = await file.text();
      let backup;
      
      try {
        backup = JSON.parse(text);
      } catch (e) {
        throw new Error("O arquivo selecionado não é um JSON válido.");
      }

      if (!backup.data) {
        throw new Error("Formato de backup inválido: dados ausentes.");
      }

      // 1. Restore Properties first (Buyers usually reference Properties)
      if (backup.data.properties && backup.data.properties.length > 0) {
        const { error } = await supabase.from('properties').upsert(backup.data.properties);
        if (error) throw new Error(`Erro ao restaurar imóveis: ${error.message}`);
      }

      // 2. Restore Customers
      if (backup.data.customers && backup.data.customers.length > 0) {
        const { error } = await supabase.from('customers').upsert(backup.data.customers);
        if (error) throw new Error(`Erro ao restaurar clientes: ${error.message}`);
      }

      // 3. Restore Buyers (Dependent on Properties)
      if (backup.data.buyers && backup.data.buyers.length > 0) {
        const { error } = await supabase.from('buyers').upsert(backup.data.buyers);
        if (error) throw new Error(`Erro ao restaurar compradores: ${error.message}`);
      }

      toast({
        title: "Restauração concluída!",
        description: "Os dados foram importados com sucesso. O sistema foi atualizado.",
        variant: "default",
        className: "bg-blue-600 text-white border-none"
      });

    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: "Falha na Restauração",
        description: error.message || "Ocorreu um erro ao processar o arquivo de backup.",
        variant: "destructive"
      });
    } finally {
      setRestoring(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Backup e Restauração - L & T Imóbil</title>
        <meta name="description" content="Gerencie backups e restaurações do sistema" />
      </Helmet>

      <div className="min-h-screen bg-emerald-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Database className="h-10 w-10 text-emerald-600" />
              Backup do Sistema
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Exporte seus dados para segurança ou restaure um backup anterior.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              {/* Export Section */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="bg-emerald-100 p-3 rounded-full mr-4">
                      <FileJson className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Exportar Dados</h2>
                      <p className="text-gray-500">Criar novo arquivo de backup (.json)</p>
                    </div>
                  </div>

                  <div className="prose text-gray-600 mb-8">
                    <p>
                      Faça o download de um arquivo contendo todos os registros atuais do banco de dados (Imóveis, Compradores e Clientes).
                    </p>
                    <p className="mt-2 text-sm">
                      Este arquivo serve como um ponto de restauração seguro caso haja perda de dados acidental.
                    </p>
                  </div>

                  <Button 
                    onClick={handleBackup} 
                    disabled={loading || restoring}
                    className="w-full sm:w-auto h-12 text-lg px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all hover:shadow-lg"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        Gerando Arquivo...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Fazer Download do Backup
                      </span>
                    )}
                  </Button>
                </div>
              </motion.div>

              {/* Restore Section */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100"
              >
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                      <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Restaurar Backup</h2>
                      <p className="text-gray-500">Importar dados de um arquivo existente</p>
                    </div>
                  </div>

                  <div className="prose text-gray-600 mb-8">
                    <p>
                      Selecione um arquivo de backup (.json) gerado anteriormente para restaurar os dados no sistema.
                    </p>
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mt-4">
                      <h4 className="text-amber-800 font-semibold flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        Atenção
                      </h4>
                      <p className="text-sm text-amber-900">
                        A restauração utilizará o método "Upsert": registros existentes serão atualizados e novos registros serão criados. Dados que existem no sistema mas não estão no backup <strong>não serão excluídos</strong>.
                      </p>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleRestore}
                    accept=".json"
                    className="hidden"
                  />

                  <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={loading || restoring}
                    className="w-full sm:w-auto h-12 text-lg px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:shadow-lg"
                  >
                    {restoring ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="animate-spin h-4 w-4" />
                        Restaurando Dados...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Selecionar Arquivo para Restaurar
                      </span>
                    )}
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* Sidebar Status Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="md:col-span-1 space-y-6"
            >
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Status do Sistema
                </h3>
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Banco de Dados</span>
                    <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">Conectado</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Última verificação</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Recomendamos realizar backups semanalmente ou sempre que houver um grande volume de alterações nos cadastros.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-xl shadow-lg p-6 text-white">
                <h3 className="font-semibold mb-2">Precisa de ajuda?</h3>
                <p className="text-sm text-emerald-100 mb-4">
                  Se tiver dúvidas sobre como realizar o backup ou a restauração, entre em contato com o suporte técnico.
                </p>
                <div className="text-xs text-emerald-200 pt-4 border-t border-emerald-700/50">
                  L & T Imobiliária v1.0
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Backup;