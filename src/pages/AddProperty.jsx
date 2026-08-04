import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import FileUploadField from '@/components/FileUploadField';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { normalizeFileArray } from '@/lib/dataMigration';

const AddProperty = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    block: '',
    fraction: '',
    status: 'Disponível',
    registry_code: '',
    city_registry_code: '',
    origin: '',
    current_owner: '',
    description: '',
    iptu_code: '',
    price: '',
    installments_count: '',
    installment_value: '',
    signal_value: '',
    signal_date: '',
    first_installment_date: ''
  });

  const [documents, setDocuments] = useState({
    certidao_onus: [],
    contrato: [],
    docs_comprador: [],
    carne_iptu: [],
    recibos: []
  });
  
  const [otherDocuments, setOtherDocuments] = useState([]);
  const [photos, setPhotos] = useState([]);

  const handleChange = e => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleDocumentChange = (key, fileObjects) => {
    setDocuments(prev => ({ ...prev, [key]: normalizeFileArray(fileObjects) }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.title.length > 20) throw new Error("Nome deve ter no máximo 20 caracteres");
      if (formData.block.length > 4) throw new Error("Quadra deve ter no máximo 4 caracteres");
      if (formData.description.length > 500) throw new Error("Histórico deve ter no máximo 500 caracteres");
      if (formData.registry_code.length > 8) throw new Error("Matrícula Cartório deve ter no máximo 8 caracteres");
      if (formData.city_registry_code.length > 15) throw new Error("Cad. Imob. Prefeitura deve ter no máximo 15 caracteres");
      if (formData.origin.length > 50) throw new Error("Origem deve ter no máximo 50 caracteres");
      if (formData.current_owner.length > 50) throw new Error("Prop. Atual deve ter no máximo 50 caracteres");

      const formattedDocuments = {
        certidao_onus: normalizeFileArray(documents.certidao_onus),
        contrato: normalizeFileArray(documents.contrato),
        docs_comprador: normalizeFileArray(documents.docs_comprador),
        carne_iptu: normalizeFileArray(documents.carne_iptu),
        recibos: normalizeFileArray(documents.recibos)
      };

      const { data, error } = await supabase.from('properties').insert([{
        title: formData.title,
        block: formData.block,
        fraction: formData.fraction,
        status: formData.status,
        registry_code: formData.registry_code,
        city_registry_code: formData.city_registry_code,
        origin: formData.origin,
        current_owner: formData.current_owner,
        description: formData.description,
        iptu_code: formData.iptu_code,
        price: parseFloat(formData.price) || 0,
        installments_count: parseInt(formData.installments_count) || 0,
        installment_value: parseFloat(formData.installment_value) || 0,
        signal_value: parseFloat(formData.signal_value) || 0,
        signal_date: formData.signal_date || null,
        first_installment_date: formData.first_installment_date || null,
        property_type: 'Outro',
        images: normalizeFileArray(photos),
        documents: formattedDocuments,
        other_documents: normalizeFileArray(otherDocuments),
        created_by: user.id
      }]).select('id, code').single();

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: `Imóvel cadastrado com sucesso! ID: ${data.code}`
      });
      navigate('/painel');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar imóvel',
        description: error.message || 'Verifique as informações preenchidas.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Adicionar Imóvel - L & T Imóbil</title>
        <meta name="description" content="Cadastre um novo imóvel" />
      </Helmet>

      <div className="min-h-screen bg-emerald-50">
        <Navbar />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link to="/painel">
            <Button variant="ghost" className="mb-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Painel
            </Button>
          </Link>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Cadastro de Imóvel</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-800 border-b pb-2">Identificação</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label>ID (Automático)</Label>
                    <Input disabled value="Gerado pelo sistema" className="mt-2 bg-gray-100 text-gray-500 font-medium" />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="title">Nome (20 caracteres)</Label>
                    <Input id="title" name="title" maxLength={20} value={formData.title} onChange={handleChange} placeholder="Nome do Imóvel" className="mt-2 text-gray-900" />
                  </div>

                  <div>
                    <Label htmlFor="block">Quadra (4 caracteres)</Label>
                    <Input id="block" name="block" maxLength={4} value={formData.block} onChange={handleChange} placeholder="Q001" className="mt-2 text-gray-900" />
                  </div>

                  <div>
                    <Label htmlFor="fraction">Fração (A-F)</Label>
                    <Select id="fraction" name="fraction" value={formData.fraction} onChange={handleChange} className="mt-2 text-gray-900">
                      <option value="">Selecione</option>
                      {['A', 'B', 'C', 'D', 'E', 'F'].map(l => <option key={l} value={l}>{l}</option>)}
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select id="status" name="status" value={formData.status} onChange={handleChange} className="mt-2 text-gray-900">
                      <option value="Disponível">Disponível</option>
                      <option value="Reservado">Reservado</option>
                      <option value="Vendido">Vendido</option>
                      <option value="Em análise">Em análise</option>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-800 border-b pb-2">Dados Registrais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="registry_code">Matrícula Cartório (8 caracteres)</Label>
                    <Input id="registry_code" name="registry_code" maxLength={8} value={formData.registry_code} onChange={handleChange} placeholder="00000000" className="mt-2 text-gray-900" />
                  </div>

                  <div>
                    <Label htmlFor="city_registry_code">Cad. Imob. Prefeitura (15 caracteres)</Label>
                    <Input id="city_registry_code" name="city_registry_code" maxLength={15} value={formData.city_registry_code} onChange={handleChange} placeholder="000000" className="mt-2 text-gray-900" />
                  </div>

                  <div>
                    <Label htmlFor="origin">Origem (50 caracteres)</Label>
                    <Input id="origin" name="origin" maxLength={50} value={formData.origin} onChange={handleChange} placeholder="Origem do imóvel" className="mt-2 text-gray-900" />
                  </div>

                  <div>
                    <Label htmlFor="current_owner">Prop. Atual (50 caracteres)</Label>
                    <Input id="current_owner" name="current_owner" maxLength={50} value={formData.current_owner} onChange={handleChange} placeholder="Proprietário atual" className="mt-2 text-gray-900" />
                  </div>

                  <div>
                    <Label htmlFor="iptu_code">IPTU (20 caracteres)</Label>
                    <Input id="iptu_code" name="iptu_code" maxLength={20} value={formData.iptu_code} onChange={handleChange} placeholder="Código IPTU" className="mt-2 text-gray-900" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-800 border-b pb-2">Detalhes</h3>
                <div>
                  <Label htmlFor="description">Histórico (max. 500 caracteres)</Label>
                  <Textarea id="description" name="description" maxLength={500} value={formData.description} onChange={handleChange} placeholder="Breve histórico do imóvel..." className="mt-2 h-32 resize-none text-gray-900" />
                  <div className="text-xs text-gray-500 text-right mt-1">
                    {formData.description.length}/500
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-800 border-b pb-2">Condições de Pagamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="price">Valor Total (R$)</Label>
                    <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} placeholder="0.00" className="mt-2 text-gray-900" />
                  </div>

                  <div>
                    <Label htmlFor="installments_count">Parcelas (3 dígitos)</Label>
                    <Input id="installments_count" name="installments_count" type="number" maxLength={3} value={formData.installments_count} onChange={handleChange} placeholder="0" className="mt-2 text-gray-900" />
                  </div>

                  <div>
                    <Label htmlFor="installment_value">Valor Parcela (R$)</Label>
                    <Input id="installment_value" name="installment_value" type="number" step="0.01" value={formData.installment_value} onChange={handleChange} placeholder="0.00" className="mt-2 text-gray-900" />
                  </div>
                  
                  <div>
                    <Label htmlFor="signal_value">Valor Sinal (R$)</Label>
                    <Input id="signal_value" name="signal_value" type="number" step="0.01" value={formData.signal_value} onChange={handleChange} placeholder="0.00" className="mt-2 text-gray-900" />
                  </div>

                  <div>
                    <Label htmlFor="signal_date">Data Sinal</Label>
                    <Input id="signal_date" name="signal_date" type="date" value={formData.signal_date} onChange={handleChange} className="mt-2 text-gray-900" />
                  </div>

                  <div>
                    <Label htmlFor="first_installment_date">Data 1ª Parcela</Label>
                    <Input id="first_installment_date" name="first_installment_date" type="date" value={formData.first_installment_date} onChange={handleChange} className="mt-2 text-gray-900" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-emerald-800 border-b pb-2">Documentos e Fotos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <FileUploadField
                      label="Certidão de Ônus"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple={true}
                      value={documents.certidao_onus}
                      onChange={(fileObjs) => handleDocumentChange('certidao_onus', fileObjs)}
                      pathPrefix={`${user?.id}/certidao_onus`}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <FileUploadField
                      label="Contrato"
                      accept=".pdf,.doc,.docx"
                      multiple={true}
                      value={documents.contrato}
                      onChange={(fileObjs) => handleDocumentChange('contrato', fileObjs)}
                      pathPrefix={`${user?.id}/contrato`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FileUploadField
                      label="Documentos do Comprador"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      multiple={true}
                      value={documents.docs_comprador}
                      onChange={(fileObjs) => handleDocumentChange('docs_comprador', fileObjs)}
                      pathPrefix={`${user?.id}/docs_comprador`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FileUploadField
                      label="Carnê do IPTU"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple={true}
                      value={documents.carne_iptu}
                      onChange={(fileObjs) => handleDocumentChange('carne_iptu', fileObjs)}
                      pathPrefix={`${user?.id}/carne_iptu`}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <FileUploadField
                      label="Recibos"
                      accept=".pdf,.doc,.docx"
                      multiple={true}
                      value={documents.recibos}
                      onChange={(fileObjs) => handleDocumentChange('recibos', fileObjs)}
                      pathPrefix={`${user?.id}/recibos`}
                      description="Faça upload de múltiplos recibos."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FileUploadField
                      label="Outros documentos"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      multiple={true}
                      value={otherDocuments}
                      onChange={(fileObjs) => setOtherDocuments(normalizeFileArray(fileObjs))}
                      pathPrefix={`${user?.id}/other_documents`}
                      description="Planilhas, arquivos de texto ou PDFs complementares."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FileUploadField
                      label="Fotos do Imóvel"
                      accept=".jpg,.jpeg,.png,.gif,.webp"
                      multiple={true}
                      value={photos}
                      onChange={(fileObjs) => setPhotos(normalizeFileArray(fileObjs))}
                      pathPrefix={`${user?.id}/photos`}
                      description="Adicione imagens de alta qualidade do imóvel."
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg font-medium">
                  {loading ? 'Salvando...' : 'Cadastrar Imóvel'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/painel')} className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-6 text-lg font-medium">
                  Cancelar
                </Button>
              </div>
            </form>
          </motion.div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default AddProperty;