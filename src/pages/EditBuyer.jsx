import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const EditBuyer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [properties, setProperties] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    cpf: '',
    address_street: '',
    address_number: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    address_cep: '',
    notes: '',
    property_id: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch properties list first
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('properties')
          .select('id, title, code, status')
          .order('title');
        
        if (propertiesError) throw propertiesError;
        setProperties(propertiesData || []);

        // Fetch buyer data
        const { data: buyerData, error: buyerError } = await supabase
          .from('buyers')
          .select('*')
          .eq('id', id)
          .single();

        if (buyerError) throw buyerError;
        
        if (buyerData) {
          setFormData({
            full_name: buyerData.full_name || '',
            email: buyerData.email || '',
            phone: buyerData.phone || '',
            cpf: buyerData.cpf || '',
            address_street: buyerData.address_street || '',
            address_number: buyerData.address_number || '',
            address_neighborhood: buyerData.address_neighborhood || '',
            address_city: buyerData.address_city || '',
            address_state: buyerData.address_state || '',
            address_cep: buyerData.address_cep || '',
            notes: buyerData.notes || '',
            property_id: buyerData.property_id || '',
          });
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar dados',
          description: error.message,
        });
        navigate('/compradores');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, toast]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Prepare data for submission
      const submissionData = {
        ...formData,
      };

      // Ensure property_id is null if empty string
      if (submissionData.property_id === '') {
        submissionData.property_id = null;
      }

      const { error } = await supabase
        .from('buyers')
        .update(submissionData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Comprador atualizado com sucesso!',
      });

      navigate('/compradores');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar comprador',
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este comprador? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('buyers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Comprador excluído',
        description: 'O registro foi removido com sucesso.',
      });

      navigate('/compradores');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: error.message,
      });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Editar Comprador - L & T Imóbil</title>
        <meta name="description" content="Editar cadastro de comprador" />
      </Helmet>

      <div className="min-h-screen bg-emerald-50">
        <Navbar />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link to="/compradores">
            <Button variant="ghost" className="mb-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Compradores
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Editar Comprador</h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">ID: {id.slice(0, 8)}...</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="property_id">Lote / Imóvel Vinculado</Label>
                  <Select
                    id="property_id"
                    name="property_id"
                    value={formData.property_id}
                    onChange={handleChange}
                    className="mt-2"
                  >
                    <option value="">Selecione um imóvel (Opcional)</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.code ? `#${property.code} - ` : ''}{property.title || 'Sem Título'} ({property.status})
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Nome completo do comprador"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@exemplo.com"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(11) 98765-4321"
                    className="mt-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    placeholder="123.456.789-00"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="address_street">Rua</Label>
                    <Input
                      id="address_street"
                      name="address_street"
                      value={formData.address_street}
                      onChange={handleChange}
                      placeholder="Rua das Flores"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address_number">Número</Label>
                    <Input
                      id="address_number"
                      name="address_number"
                      value={formData.address_number}
                      onChange={handleChange}
                      placeholder="123"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address_neighborhood">Bairro</Label>
                    <Input
                      id="address_neighborhood"
                      name="address_neighborhood"
                      value={formData.address_neighborhood}
                      onChange={handleChange}
                      placeholder="Centro"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address_city">Cidade</Label>
                    <Input
                      id="address_city"
                      name="address_city"
                      value={formData.address_city}
                      onChange={handleChange}
                      placeholder="São Paulo"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address_state">Estado</Label>
                    <Input
                      id="address_state"
                      name="address_state"
                      value={formData.address_state}
                      onChange={handleChange}
                      placeholder="SP"
                      maxLength={2}
                      className="mt-2"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address_cep">CEP</Label>
                    <Input
                      id="address_cep"
                      name="address_cep"
                      value={formData.address_cep}
                      onChange={handleChange}
                      placeholder="12345-678"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Adicione observações sobre o comprador"
                  className="mt-2"
                />
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={saving || deleting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg"
                >
                  <Save className="h-5 w-5 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/compradores')}
                  disabled={saving || deleting}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-6 text-lg"
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving || deleting}
                  className="bg-red-600 hover:bg-red-700 text-white py-6 text-lg px-8"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  {deleting ? 'Excluindo...' : 'Excluir'}
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

export default EditBuyer;