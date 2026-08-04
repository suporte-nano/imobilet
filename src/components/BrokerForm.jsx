import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { normalizeFileArray } from '@/lib/dataMigration';
import { useFileUpload } from '@/hooks/useFileUpload';

const BrokerForm = ({ broker = null, mode = 'create' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { uploadFile } = useFileUpload();
  const [loading, setLoading] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
    rg: '',
    rg_uf: '',
    data_nascimento: '',
    endereco_rua: '',
    endereco_numero: '',
    endereco_bairro: '',
    endereco_cidade: '',
    endereco_estado: '',
    endereco_cep: '',
    estado_civil: '',
    creci_numero: '',
    creci_situacao: '',
    cnpj: '',
    data_inicio_atividades: '',
    telefone: '',
    email_profissional: '',
    site_perfil: '',
    pix: '',
    banco_agencia: '',
    banco_conta: '',
    modelo_comissao: '',
    especialidade: '',
    aceite_lgpd: false,
    documentos_urls: [],
  });

  const [documentFiles, setDocumentFiles] = useState({
    creci: null,
    rg: null,
    cpf: null,
    comprovante: null,
  });

  const requiredFields = [
    'nome_completo', 'cpf', 'rg', 'rg_uf', 'data_nascimento', 
    'endereco_rua', 'endereco_numero', 'endereco_bairro', 'endereco_cidade', 
    'endereco_estado', 'endereco_cep', 'estado_civil', 'creci_numero', 
    'creci_situacao', 'telefone', 'email_profissional', 'aceite_lgpd'
  ];

  useEffect(() => {
    if (broker && mode === 'edit') {
      const parsedDocs = normalizeFileArray(broker.documentos_urls);

      setFormData({
        nome_completo: broker.nome_completo || '',
        cpf: broker.cpf || '',
        rg: broker.rg || '',
        rg_uf: broker.rg_uf || '',
        data_nascimento: broker.data_nascimento ? broker.data_nascimento.split('T')[0] : '',
        endereco_rua: broker.endereco_rua || '',
        endereco_numero: broker.endereco_numero || '',
        endereco_bairro: broker.endereco_bairro || '',
        endereco_cidade: broker.endereco_cidade || '',
        endereco_estado: broker.endereco_estado || '',
        endereco_cep: broker.endereco_cep || '',
        estado_civil: broker.estado_civil || '',
        creci_numero: broker.creci_numero || '',
        creci_situacao: broker.creci_situacao || '',
        cnpj: broker.cnpj || '',
        data_inicio_atividades: broker.data_inicio_atividades ? broker.data_inicio_atividades.split('T')[0] : '',
        telefone: broker.telefone || '',
        email_profissional: broker.email_profissional || '',
        site_perfil: broker.site_perfil || '',
        pix: broker.pix || '',
        banco_agencia: broker.banco_agencia || '',
        banco_conta: broker.banco_conta || '',
        modelo_comissao: broker.modelo_comissao || '',
        especialidade: broker.especialidade || '',
        aceite_lgpd: broker.aceite_lgpd || false,
        documentos_urls: parsedDocs,
      });
    }
  }, [broker, mode]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleFileChange = (docType, file) => {
    setDocumentFiles(prev => ({ ...prev, [docType]: file }));
  };

  const formatDateForSupabase = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    requiredFields.forEach(field => {
      if (field === 'aceite_lgpd') {
        if (!formData[field]) {
          newErrors[field] = 'É necessário aceitar os termos da LGPD.';
          isValid = false;
        }
      } else if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = 'Este campo é obrigatório.';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const isFormValid = requiredFields.every(field => {
    if (field === 'aceite_lgpd') return formData[field] === true;
    return formData[field] && formData[field].toString().trim() !== '';
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios corretamente.',
      });
      return;
    }

    try {
      setLoading(true);
      setUploadingDocs(true);

      // Upload documents and create JSONB objects
      const uploadedDocs = [...(formData.documentos_urls || [])];
      
      for (const [docType, file] of Object.entries(documentFiles)) {
        if (file) {
          try {
            const docObj = await uploadFile(file, 'broker_documents', `docs/${user?.id || 'anonymous'}`);
            if (docObj) uploadedDocs.push(docObj);
          } catch (err) {
            toast({
              variant: 'destructive',
              title: `Erro no upload: ${docType}`,
              description: 'Ocorreu um erro ao tentar enviar o documento.'
            });
            setLoading(false);
            setUploadingDocs(false);
            return;
          }
        }
      }

      setUploadingDocs(false);

      const formattedDocsJsonb = normalizeFileArray(uploadedDocs);

      // Prepare payload and filter empty dates
      const brokerData = {
        ...formData,
        documentos_urls: formattedDocsJsonb,
        created_by: user?.id,
      };

      if (brokerData.data_nascimento) {
        brokerData.data_nascimento = formatDateForSupabase(brokerData.data_nascimento);
      } else {
        delete brokerData.data_nascimento;
      }

      if (brokerData.data_inicio_atividades) {
        brokerData.data_inicio_atividades = formatDateForSupabase(brokerData.data_inicio_atividades);
      } else {
        delete brokerData.data_inicio_atividades;
      }

      if (mode === 'create') {
        const { error } = await supabase
          .from('brokers')
          .insert([brokerData]);

        if (error) throw error;

        toast({
          title: 'Corretor cadastrado',
          description: 'Corretor adicionado com sucesso!',
        });

        navigate('/corretores');
      } else {
        const { error } = await supabase
          .from('brokers')
          .update(brokerData)
          .eq('id', broker.id);

        if (error) throw error;

        toast({
          title: 'Corretor atualizado',
          description: 'Dados do corretor atualizados com sucesso!',
        });

        navigate('/corretores');
      }
    } catch (error) {
      console.error('Error saving broker:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os dados. Verifique sua conexão e tente novamente.',
      });
      setLoading(false);
      setUploadingDocs(false);
    }
  };

  const brazilianStates = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

  const inputClass = (field) => `mt-1 ${errors[field] ? 'border-red-500 focus-visible:ring-red-500' : ''}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Dados Pessoais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dados Pessoais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="nome_completo" className="text-gray-700">Nome Completo *</Label>
            <Input
              id="nome_completo"
              value={formData.nome_completo}
              onChange={(e) => handleInputChange('nome_completo', e.target.value)}
              placeholder="Nome completo do corretor"
              className={inputClass('nome_completo')}
            />
            {errors.nome_completo && <p className="text-red-500 text-sm mt-1">{errors.nome_completo}</p>}
          </div>
          <div>
            <Label htmlFor="cpf" className="text-gray-700">CPF *</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => handleInputChange('cpf', e.target.value)}
              placeholder="000.000.000-00"
              className={inputClass('cpf')}
            />
            {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
          </div>
          <div>
            <Label htmlFor="rg" className="text-gray-700">RG *</Label>
            <Input
              id="rg"
              value={formData.rg}
              onChange={(e) => handleInputChange('rg', e.target.value)}
              placeholder="00.000.000-0"
              className={inputClass('rg')}
            />
            {errors.rg && <p className="text-red-500 text-sm mt-1">{errors.rg}</p>}
          </div>
          <div>
            <Label htmlFor="rg_uf" className="text-gray-700">UF do RG *</Label>
            <Select
              id="rg_uf"
              value={formData.rg_uf}
              onChange={(e) => handleInputChange('rg_uf', e.target.value)}
              className={inputClass('rg_uf')}
            >
              <option value="">Selecione</option>
              {brazilianStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </Select>
            {errors.rg_uf && <p className="text-red-500 text-sm mt-1">{errors.rg_uf}</p>}
          </div>
          <div>
            <Label htmlFor="data_nascimento" className="text-gray-700">Data de Nascimento *</Label>
            <Input
              id="data_nascimento"
              type="date"
              value={formData.data_nascimento}
              onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
              className={inputClass('data_nascimento')}
            />
            {errors.data_nascimento && <p className="text-red-500 text-sm mt-1">{errors.data_nascimento}</p>}
          </div>
          <div>
            <Label htmlFor="estado_civil" className="text-gray-700">Estado Civil *</Label>
            <Select
              id="estado_civil"
              value={formData.estado_civil}
              onChange={(e) => handleInputChange('estado_civil', e.target.value)}
              className={inputClass('estado_civil')}
            >
              <option value="">Selecione</option>
              <option value="Solteiro(a)">Solteiro(a)</option>
              <option value="Casado(a)">Casado(a)</option>
              <option value="Divorciado(a)">Divorciado(a)</option>
              <option value="Viúvo(a)">Viúvo(a)</option>
              <option value="União Estável">União Estável</option>
            </Select>
            {errors.estado_civil && <p className="text-red-500 text-sm mt-1">{errors.estado_civil}</p>}
          </div>
        </div>
      </motion.div>

      {/* Endereço Residencial */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Endereço Residencial</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Label htmlFor="endereco_rua" className="text-gray-700">Rua *</Label>
            <Input
              id="endereco_rua"
              value={formData.endereco_rua}
              onChange={(e) => handleInputChange('endereco_rua', e.target.value)}
              placeholder="Nome da rua"
              className={inputClass('endereco_rua')}
            />
            {errors.endereco_rua && <p className="text-red-500 text-sm mt-1">{errors.endereco_rua}</p>}
          </div>
          <div>
            <Label htmlFor="endereco_numero" className="text-gray-700">Número *</Label>
            <Input
              id="endereco_numero"
              value={formData.endereco_numero}
              onChange={(e) => handleInputChange('endereco_numero', e.target.value)}
              placeholder="000"
              className={inputClass('endereco_numero')}
            />
            {errors.endereco_numero && <p className="text-red-500 text-sm mt-1">{errors.endereco_numero}</p>}
          </div>
          <div>
            <Label htmlFor="endereco_bairro" className="text-gray-700">Bairro *</Label>
            <Input
              id="endereco_bairro"
              value={formData.endereco_bairro}
              onChange={(e) => handleInputChange('endereco_bairro', e.target.value)}
              placeholder="Nome do bairro"
              className={inputClass('endereco_bairro')}
            />
            {errors.endereco_bairro && <p className="text-red-500 text-sm mt-1">{errors.endereco_bairro}</p>}
          </div>
          <div>
            <Label htmlFor="endereco_cidade" className="text-gray-700">Cidade *</Label>
            <Input
              id="endereco_cidade"
              value={formData.endereco_cidade}
              onChange={(e) => handleInputChange('endereco_cidade', e.target.value)}
              placeholder="Nome da cidade"
              className={inputClass('endereco_cidade')}
            />
            {errors.endereco_cidade && <p className="text-red-500 text-sm mt-1">{errors.endereco_cidade}</p>}
          </div>
          <div>
            <Label htmlFor="endereco_estado" className="text-gray-700">Estado *</Label>
            <Select
              id="endereco_estado"
              value={formData.endereco_estado}
              onChange={(e) => handleInputChange('endereco_estado', e.target.value)}
              className={inputClass('endereco_estado')}
            >
              <option value="">Selecione</option>
              {brazilianStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </Select>
            {errors.endereco_estado && <p className="text-red-500 text-sm mt-1">{errors.endereco_estado}</p>}
          </div>
          <div>
            <Label htmlFor="endereco_cep" className="text-gray-700">CEP *</Label>
            <Input
              id="endereco_cep"
              value={formData.endereco_cep}
              onChange={(e) => handleInputChange('endereco_cep', e.target.value)}
              placeholder="00000-000"
              className={inputClass('endereco_cep')}
            />
            {errors.endereco_cep && <p className="text-red-500 text-sm mt-1">{errors.endereco_cep}</p>}
          </div>
        </div>
      </motion.div>

      {/* Dados Profissionais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dados Profissionais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="creci_numero" className="text-gray-700">Número CRECI *</Label>
            <Input
              id="creci_numero"
              value={formData.creci_numero}
              onChange={(e) => handleInputChange('creci_numero', e.target.value)}
              placeholder="0000000-F"
              className={inputClass('creci_numero')}
            />
            {errors.creci_numero && <p className="text-red-500 text-sm mt-1">{errors.creci_numero}</p>}
          </div>
          <div>
            <Label htmlFor="creci_situacao" className="text-gray-700">Situação CRECI *</Label>
            <Select
              id="creci_situacao"
              value={formData.creci_situacao}
              onChange={(e) => handleInputChange('creci_situacao', e.target.value)}
              className={inputClass('creci_situacao')}
            >
              <option value="">Selecione</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              <option value="Suspenso">Suspenso</option>
              <option value="Em processo">Em processo</option>
            </Select>
            {errors.creci_situacao && <p className="text-red-500 text-sm mt-1">{errors.creci_situacao}</p>}
          </div>
          <div>
            <Label htmlFor="cnpj" className="text-gray-700">CNPJ (Opcional)</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => handleInputChange('cnpj', e.target.value)}
              placeholder="00.000.000/0000-00"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="data_inicio_atividades" className="text-gray-700">Data Início Atividades</Label>
            <Input
              id="data_inicio_atividades"
              type="date"
              value={formData.data_inicio_atividades}
              onChange={(e) => handleInputChange('data_inicio_atividades', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="especialidade" className="text-gray-700">Especialidade</Label>
            <Input
              id="especialidade"
              value={formData.especialidade}
              onChange={(e) => handleInputChange('especialidade', e.target.value)}
              placeholder="Ex: Imóveis comerciais"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="modelo_comissao" className="text-gray-700">Modelo de Comissão</Label>
            <Select
              id="modelo_comissao"
              value={formData.modelo_comissao}
              onChange={(e) => handleInputChange('modelo_comissao', e.target.value)}
              className="mt-1"
            >
              <option value="">Selecione</option>
              <option value="Percentual fixo">Percentual fixo</option>
              <option value="Percentual variável">Percentual variável</option>
              <option value="Valor fixo">Valor fixo</option>
              <option value="Misto">Misto</option>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Contato */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Contato</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="telefone" className="text-gray-700">Telefone *</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => handleInputChange('telefone', e.target.value)}
              placeholder="(00) 00000-0000"
              className={inputClass('telefone')}
            />
            {errors.telefone && <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>}
          </div>
          <div>
            <Label htmlFor="email_profissional" className="text-gray-700">Email Profissional *</Label>
            <Input
              id="email_profissional"
              type="email"
              value={formData.email_profissional}
              onChange={(e) => handleInputChange('email_profissional', e.target.value)}
              placeholder="corretor@email.com"
              className={inputClass('email_profissional')}
            />
            {errors.email_profissional && <p className="text-red-500 text-sm mt-1">{errors.email_profissional}</p>}
          </div>
          <div>
            <Label htmlFor="site_perfil" className="text-gray-700">Site/Perfil Profissional</Label>
            <Input
              id="site_perfil"
              type="url"
              value={formData.site_perfil}
              onChange={(e) => handleInputChange('site_perfil', e.target.value)}
              placeholder="https://..."
              className="mt-1"
            />
          </div>
        </div>
      </motion.div>

      {/* Dados Bancários */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dados Bancários</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="pix" className="text-gray-700">Chave PIX</Label>
            <Input
              id="pix"
              value={formData.pix}
              onChange={(e) => handleInputChange('pix', e.target.value)}
              placeholder="CPF, email, telefone ou chave aleatória"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="banco_agencia" className="text-gray-700">Agência</Label>
            <Input
              id="banco_agencia"
              value={formData.banco_agencia}
              onChange={(e) => handleInputChange('banco_agencia', e.target.value)}
              placeholder="0000"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="banco_conta" className="text-gray-700">Conta</Label>
            <Input
              id="banco_conta"
              value={formData.banco_conta}
              onChange={(e) => handleInputChange('banco_conta', e.target.value)}
              placeholder="00000-0"
              className="mt-1"
            />
          </div>
        </div>
      </motion.div>

      {/* Documentos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Documentos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="doc_creci" className="text-gray-700">Documento CRECI</Label>
            <Input
              id="doc_creci"
              type="file"
              onChange={(e) => handleFileChange('creci', e.target.files[0])}
              accept=".pdf,.jpg,.jpeg,.png"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="doc_rg" className="text-gray-700">RG (Frente e Verso)</Label>
            <Input
              id="doc_rg"
              type="file"
              onChange={(e) => handleFileChange('rg', e.target.files[0])}
              accept=".pdf,.jpg,.jpeg,.png"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="doc_cpf" className="text-gray-700">CPF</Label>
            <Input
              id="doc_cpf"
              type="file"
              onChange={(e) => handleFileChange('cpf', e.target.files[0])}
              accept=".pdf,.jpg,.jpeg,.png"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="doc_comprovante" className="text-gray-700">Comprovante de Residência</Label>
            <Input
              id="doc_comprovante"
              type="file"
              onChange={(e) => handleFileChange('comprovante', e.target.files[0])}
              accept=".pdf,.jpg,.jpeg,.png"
              className="mt-1"
            />
          </div>
        </div>
      </motion.div>

      {/* LGPD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <div className="flex items-start space-x-3">
          <Checkbox
            id="aceite_lgpd"
            checked={formData.aceite_lgpd}
            onCheckedChange={(checked) => handleInputChange('aceite_lgpd', checked)}
            className={errors.aceite_lgpd ? 'border-red-500 data-[state=checked]:bg-red-500' : ''}
          />
          <div className="flex-1">
            <Label htmlFor="aceite_lgpd" className={`cursor-pointer ${errors.aceite_lgpd ? 'text-red-500' : 'text-gray-700'}`}>
              Aceito os termos da LGPD *
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              Ao marcar esta caixa, você concorda com o tratamento de seus dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD).
            </p>
            {errors.aceite_lgpd && <p className="text-red-500 text-sm mt-1">{errors.aceite_lgpd}</p>}
          </div>
        </div>
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex justify-end gap-4"
      >
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/corretores')}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || uploadingDocs || !isFormValid}
          className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
        >
          {loading ? (
            <>
              {uploadingDocs ? (
                <>
                  <Upload className="h-5 w-5 mr-2 animate-pulse" />
                  Enviando documentos...
                </>
              ) : (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              )}
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              {mode === 'create' ? 'Cadastrar Corretor' : 'Atualizar Corretor'}
            </>
          )}
        </Button>
      </motion.div>
    </form>
  );
};

export default BrokerForm;