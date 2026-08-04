import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/PropertyCard';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Properties = () => {
  const { toast } = useToast();
  const { user, signOut, validateSession } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    minPrice: '',
    maxPrice: '',
    customId: '', 
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setErrorState(null);

      // Validate session if user is supposedly logged in
      if (user) {
        const isValid = await validateSession();
        if (!isValid) {
          toast({
            variant: "destructive",
            title: "Sessão expirada",
            description: "Por favor, faça login novamente."
          });
          await signOut();
          navigate('/login');
          return;
        }
      }

      let query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.search) query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      if (filters.customId) query = query.eq('custom_id', filters.customId);
      if (filters.minPrice) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice) query = query.lte('price', filters.maxPrice);

      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('JWT') || error.message.includes('auth')) {
          if (user) await signOut();
          navigate('/login');
          throw new Error("Sessão inválida. Por favor, faça login novamente.");
        }
        throw error;
      }
      
      setProperties(data || []);
    } catch (error) {
      setErrorState(error.message || "Erro ao carregar propriedades.");
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar imóveis',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, user, validateSession, signOut, navigate, toast]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      minPrice: '',
      maxPrice: '',
      customId: '',
    });
  };

  return (
    <>
      <Helmet>
        <title>Imóveis - L & T Imóbil</title>
        <meta name="description" content="Catálogo completo de imóveis." />
      </Helmet>

      <div className="min-h-screen bg-emerald-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Imóveis</h1>
            <p className="text-lg text-gray-600">Gerencie o catálogo de imóveis</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou histórico..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && fetchProperties()}
                />
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white"
              >
                <SlidersHorizontal className="h-5 w-5 mr-2" />
                Filtros
              </Button>
              <Button
                onClick={fetchProperties}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Buscar
              </Button>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="Disponível">Disponível</option>
                    <option value="Reservado">Reservado</option>
                    <option value="Vendido">Vendido</option>
                    <option value="Em análise">Em análise</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ID (Código)</label>
                  <Input
                    placeholder="Ex: 000123"
                    value={filters.customId}
                    onChange={(e) => handleFilterChange('customId', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preço Mínimo</label>
                  <Input
                    type="number"
                    placeholder="R$ 0"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preço Máximo</label>
                  <Input
                    type="number"
                    placeholder="R$ 0"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="w-full"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : errorState ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-lg border border-red-100">
              <p className="text-xl text-red-600 mb-4">{errorState}</p>
              <Button onClick={fetchProperties} className="bg-emerald-600 hover:bg-emerald-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-lg">
              <p className="text-xl text-gray-600">Nenhum imóvel encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div key={property.id} className="relative group">
                  <PropertyCard property={property} />
                  {user && (
                    <div className="mt-4 flex justify-end">
                      <Link to={`/editar-imovel/${property.id}`}>
                        <Button variant="outline" size="sm" className="h-8 px-3 py-1 text-xs border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white">
                          Editar
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Properties;