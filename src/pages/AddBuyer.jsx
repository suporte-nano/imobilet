import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
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

const AddBuyer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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
    const fetchProperties = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('id, title, code, status')
          .order('title');
        
        if (error) throw error;
        setProperties(data || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };

    fetchProperties();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data for submission
      const submissionData = {
        ...formData,
        created_by: user.id,
      };

      // Remove property_id if it's an empty string (to allow NULL in DB)
      if (submissionData.property_id === '') {
        delete submissionData.property_id;
      }

      const { data, error } = await supabase.from('buyers').insert([
        submissionData
      ]).select('id, code').single();

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: `Comprador cadastrado com sucesso! ID: ${data.code}`,
      });

      navigate('/compradores');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar comprador',
        description: 'Verifique os dados informados ou sua conexão com a internet.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Adicionar Comprador - L & T Imóbil</title>
        <meta name="description" content="Cadastre um novo comprador" />
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
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Adicionar Novo Comprador</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ID Field - Auto generated */}
                <div>
                    <Label>ID (Automático)</Label>
                    <Input disabled value="Gerado pelo sistema" className="mt-2 bg-gray-100 text-gray-500" />
                </div>

                {/* Property Selection Field */}
                <div>
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

              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg"
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar Comprador'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/compradores')}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-6 text-lg"
                >
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

export default AddBuyer;