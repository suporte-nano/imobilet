import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, Plus, ArrowLeft, Search, Building2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const Buyers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    try {
      setLoading(true);
      // Fetch buyers and their related property data
      const { data, error } = await supabase
        .from('buyers')
        .select('*, properties (title, code, block, fraction)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBuyers(data || []);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar compradores',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredBuyers = buyers.filter(buyer => {
    const searchLower = searchTerm.toLowerCase();
    
    // Search in Buyer Name
    const nameMatch = buyer.full_name?.toLowerCase().includes(searchLower);
    
    // Search in Buyer CPF
    const cpfMatch = buyer.cpf?.includes(searchLower);
    
    // Search in Linked Property Details (if any)
    const propertyTitleMatch = buyer.properties?.title?.toLowerCase().includes(searchLower);
    const propertyCodeMatch = buyer.properties?.code?.toString().includes(searchLower);
    const propertyBlockMatch = buyer.properties?.block?.toLowerCase().includes(searchLower);

    return nameMatch || cpfMatch || propertyTitleMatch || propertyCodeMatch || propertyBlockMatch;
  });

  return (
    <>
      <Helmet>
        <title>Compradores - L & T Imóbil</title>
        <meta name="description" content="Gerencie seus compradores cadastrados" />
      </Helmet>

      <div className="min-h-screen bg-emerald-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <Link to="/painel">
                <Button variant="ghost" className="mb-4 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Painel
                </Button>
              </Link>
              <h1 className="text-4xl font-bold text-gray-900">Compradores</h1>
              <p className="text-lg text-gray-600 mt-2">Gerencie todos os clientes compradores do sistema</p>
            </div>
            <Link to="/adicionar-comprador">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-5 w-5 mr-2" />
                Adicionar Comprador
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nome, CPF ou lote/imóvel..."
                className="pl-10 py-6 text-lg border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="mt-2 text-sm text-gray-500 px-1">
              {filteredBuyers.length} registro{filteredBuyers.length !== 1 ? 's' : ''} encontrado{filteredBuyers.length !== 1 ? 's' : ''}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : filteredBuyers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 bg-white rounded-xl shadow-lg"
            >
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600 mb-6">
                {searchTerm ? 'Nenhum comprador encontrado para esta busca.' : 'Nenhum comprador cadastrado no sistema.'}
              </p>
              {searchTerm ? (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Limpar Busca
                </Button>
              ) : (
                <Link to="/adicionar-comprador">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="h-5 w-5 mr-2" />
                    Adicionar Primeiro Comprador
                  </Button>
                </Link>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBuyers.map((buyer, index) => (
                <motion.div
                  key={buyer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="bg-emerald-100 p-3 rounded-full mr-4">
                        <Users className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-lg font-semibold text-gray-900 truncate" title={buyer.full_name}>{buyer.full_name}</h3>
                        <p className="text-sm text-gray-500">CPF: {buyer.cpf || 'Não informado'}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Property Link Highlight */}
                      {buyer.properties ? (
                        <div className="flex items-start text-emerald-700 bg-emerald-50 p-2 rounded-md border border-emerald-100">
                          <Building2 className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm font-medium">
                             {buyer.properties.code ? `#${buyer.properties.code} - ` : ''}
                             {buyer.properties.title}
                             {buyer.properties.block ? ` (Q${buyer.properties.block})` : ''}
                          </span>
                        </div>
                      ) : (
                         <div className="flex items-start text-gray-400 bg-gray-50 p-2 rounded-md border border-gray-100 italic">
                          <Building2 className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Nenhum imóvel vinculado</span>
                        </div>
                      )}

                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2 text-emerald-600" />
                        <span className="text-sm truncate" title={buyer.email}>{buyer.email || '-'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-emerald-600" />
                        <span className="text-sm">{buyer.phone || '-'}</span>
                      </div>
                    </div>

                    {buyer.notes && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-600 line-clamp-2 italic">"{buyer.notes}"</p>
                      </div>
                    )}
                  </div>
                  
                  {user && (
                    <div className="mt-4 pt-4 border-t flex justify-end">
                      <Link to={`/editar-comprador/${buyer.id}`}>
                        <Button variant="outline" size="sm" className="h-8 px-3 py-1 text-xs border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white">
                          Editar
                        </Button>
                      </Link>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Buyers;