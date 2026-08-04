import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Trash2, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import FileUploadField from '@/components/FileUploadField';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { normalizeFileArray } from '@/lib/dataMigration';

const EditProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [buyerCount, setBuyerCount] = useState(0);
  
  const [formData, setFormData] = useState({
    code: '',
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

  useEffect(() => {
    let timeoutId;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorState(null);

        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
        
        if (!isValidUUID) {
          throw new Error('ID de imóvel inválido.');
        }

        const { data: propData, error: propError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();

        if (propError) {
          if (propError.code === 'PGRST116') {
             throw new Error('Imóvel não encontrado.');
          }
          throw propError;
        }
        
        if (!propData) throw new Error('Imóvel não encontrado.');
        
        setFormData({
          code: propData.code || '',
          title: propData.title || '',
          block: propData.block || '',
          fraction: propData.fraction || '',
          status: propData.status || 'Disponível',
          registry_code: propData.registry_code || '',
          city_registry_code: propData.city_registry_code || '',
          origin: propData.origin || '',
          current_owner: propData.current_owner || '',
          description: propData.description || '',
          iptu_code: propData.iptu_code || '',
          price: propData.price || '',
          installments_count: propData.installments_count || '',
          installment_value: propData.installment_value || '',
          signal_value: propData.signal_value || '',
          signal_date: propData.signal_date || '',
          first_installment_date: propData.first_installment_date || ''
        });

        const docs = propData.documents || {};
        setDocuments({
          certidao_onus: normalizeFileArray(docs.certidao_onus),
          contrato: normalizeFileArray(docs.contrato),
          docs_comprador: normalizeFileArray(docs.docs_comprador),
          carne_iptu: normalizeFileArray(docs.carne_iptu),
          recibos: normalizeFileArray(docs.recibos)
        });
        
        setPhotos(normalizeFileArray(propData.images));
        setOtherDocuments(normalizeFileArray(propData.other_documents));

        const { count, error: countError } = await supabase
          .from('buyers')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', id);

        if (!countError && count !== null) {
          setBuyerCount(count);
        }
      } catch (error) {
        setErrorState(error.message);
        toast({
          variant: "destructive",
          title: "Erro ao carregar imóvel",
          description: error.message || "Não foi possível carregar os dados."
        });
        
        timeoutId = setTimeout(() => navigate('/imoveis'), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [id, navigate, toast]);

  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDocumentChange = (key, fileObjects) => {
    setDocuments(prev => ({ ...prev, [key]: normalizeFileArray(fileObjects) }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (formData.title.length > 20) throw new Error("Nome deve ter no máximo 20 caracteres");
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

      const { error } = await supabase.from('properties').update({
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
        images: normalizeFileArray(photos),
        documents: formattedDocuments,
        other_documents: normalizeFileArray(otherDocuments)
      }).eq('id', id);
      
      if (error) throw error;
      
      toast({ title: 'Sucesso!', description: 'Imóvel atualizado com sucesso!' });
      navigate('/imoveis');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) throw new Error(error.message);
      toast({ title: 'Imóvel excluído', description: 'Removido com sucesso.' });
      navigate('/imoveis');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
      </div>
    );
  }

  if (errorState || (!formData.title && !formData.code)) {
    return (
      <div className="min-h-screen bg-emerald-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ops!</h2>
            <p className="text-gray-600 mb-6">{errorState || 'Imóvel não encontrado.'}</p>
            <Link to="/imoveis"><Button className="w-full bg-emerald-600">Voltar</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Editar Imóvel - L & T Imóbil</title>
        <meta name="description" content="Editar informações do imóvel" />
      </Helmet>

      <div className="min-h-screen bg-emerald-50">
        <Navbar />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link to="/painel">
            <Button variant="ghost" className="mb-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Painel
            </Button>
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Editar Imóvel</h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">UUID: {id.slice(0, 8)}...</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-800 border-b pb-2">Identificação</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label>ID (Automático)</Label>
                    <Input disabled value={formData.code || 'N/A'} className="mt-2 bg-gray-100 text-gray-500 font-medium" />
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
                      description="Múltiplos arquivos permitidos."
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
                      description="Múltiplas imagens permitidas."
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-6">
                <Button type="submit" disabled={saving || deleting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg font-medium">
                  <Save className="h-5 w-5 mr-2" /> {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                
                <Button type="button" variant="outline" onClick={() => navigate('/painel')} disabled={saving || deleting} className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-6 text-lg font-medium">
                  Cancelar
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" disabled={saving || deleting} className="bg-red-600 hover:bg-red-700 text-white py-6 text-lg px-8 font-medium">
                      <Trash2 className="h-5 w-5 mr-2" /> {deleting ? 'Excluindo...' : 'Excluir'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center text-red-600">
                        <AlertTriangle className="h-5 w-5 mr-2" /> Confirmar Exclusão
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-base text-gray-700">
                        Tem certeza que deseja excluir este imóvel?
                        {buyerCount > 0 && <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800 font-medium">
                            ATENÇÃO: A exclusão também removerá {buyerCount} comprador(es) associado(s).
                          </div>}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
                        Sim, excluir permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </form>
          </motion.div>
        </div>
        <Footer />
      </div>
    </>
  );
};
export default EditProperty;