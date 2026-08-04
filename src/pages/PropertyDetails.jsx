import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ArrowLeft, Calendar, FileText, Tag, DollarSign, CreditCard, User, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { normalizeFileArray } from '@/lib/dataMigration';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    let timeoutId;
    
    const fetchProperty = async () => {
      try {
        setLoading(true);
        setErrorState(null);

        // Validate UUID format before making the request
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
        
        if (!isValidUUID) {
          throw new Error('ID de imóvel inválido.');
        }

        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
             throw new Error('Imóvel não encontrado.');
          }
          throw error;
        }
        
        if (!data) {
           throw new Error('Imóvel não encontrado.');
        }

        setProperty(data);
      } catch (error) {
        setErrorState(error.message);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: error.message,
        });
        
        // Auto redirect after 3 seconds if not found
        timeoutId = setTimeout(() => {
          navigate('/imoveis');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [id, navigate, toast]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando detalhes do imóvel...</p>
        </div>
      </div>
    );
  }

  if (errorState || !property) {
    return (
      <div className="min-h-screen bg-emerald-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ops!</h2>
            <p className="text-gray-600 mb-6">{errorState || 'O imóvel que você procura não existe ou foi removido.'}</p>
            <p className="text-sm text-gray-500 mb-6">Redirecionando em 3 segundos...</p>
            <Link to="/imoveis">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Voltar para Imóveis agora</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Use the utility to normalize JSONB arrays. The URLs stored here are already pointing
  // to the sanitized filenames in Supabase storage.
  const parsedImages = normalizeFileArray(property.images);
  const images = parsedImages.length > 0 
    ? parsedImages.map(img => img.url) 
    : ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'];

  const docs = property.documents || {};

  return (
    <>
      <Helmet>
        <title>{property.title || 'Detalhes'} - L & T Imóbil</title>
        <meta name="description" content={property.description} />
      </Helmet>

      <div className="min-h-screen bg-emerald-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link to="/imoveis">
            <Button variant="ghost" className="mb-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Imóveis
            </Button>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2"
            >
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="aspect-video relative bg-gray-100">
                  <img
                    src={images[selectedImage]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-sm font-bold text-emerald-800 shadow-sm">
                    {property.status}
                  </div>
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 p-4 overflow-x-auto">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImage === index ? 'border-emerald-600' : 'border-transparent'
                        }`}
                      >
                        <img src={img} alt={`Thumb ${index}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg p-6 mt-6 space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Histórico / Descrição</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{property.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                  <div>
                    <h3 className="font-semibold text-emerald-800 mb-3">Dados do Registro</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex justify-between"><span>Matrícula:</span> <span className="font-medium">{property.registry_code}</span></li>
                      <li className="flex justify-between"><span>Cad. Imob:</span> <span className="font-medium">{property.city_registry_code}</span></li>
                      <li className="flex justify-between"><span>IPTU:</span> <span className="font-medium">{property.iptu_code}</span></li>
                      <li className="flex justify-between"><span>Origem:</span> <span className="font-medium">{property.origin}</span></li>
                      <li className="flex justify-between"><span>Prop. Atual:</span> <span className="font-medium">{property.current_owner}</span></li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-emerald-800 mb-3">Documentos Anexados</h3>
                    <ul className="space-y-2">
                      {[
                        { k: 'certidao_onus', l: 'Certidão de Ônus' },
                        { k: 'contrato', l: 'Contrato' },
                        { k: 'docs_comprador', l: 'Docs. Comprador' },
                        { k: 'carne_iptu', l: 'Carnê IPTU' },
                        { k: 'recibos', l: 'Recibos' },
                      ].map(item => {
                        const docArray = normalizeFileArray(docs[item.k]);
                        const firstDoc = docArray[0];
                        const docUrl = firstDoc ? firstDoc.url : null;
                        
                        return (
                          <li key={item.k} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{item.l}</span>
                            {docUrl ? (
                              <a href={docUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-medium flex items-center">
                                <FileText className="h-3 w-3 mr-1" /> Ver
                              </a>
                            ) : (
                              <span className="text-gray-400 italic">Não anexado</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                <div className="mb-2 flex items-center justify-between">
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-mono">
                    ID: {property.custom_id || property.code}
                  </span>
                  <span className="text-sm font-medium text-emerald-600">
                    {property.block} - {property.fraction}
                  </span>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{property.title}</h1>
                
                <div className="text-4xl font-bold text-emerald-600 mb-6">
                  {formatCurrency(property.price)}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <div className="flex items-center text-emerald-800">
                      <CreditCard className="h-5 w-5 mr-2" />
                      <span className="font-medium">Parcelamento</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-700">{property.installments_count}x</div>
                      <div className="text-sm text-emerald-600">{formatCurrency(property.installment_value)}</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-gray-400"/> Data Sinal:</div>
                      <span className="font-medium">{formatDate(property.signal_date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-gray-400"/> 1ª Parcela:</div>
                      <span className="font-medium">{formatDate(property.first_installment_date)}</span>
                    </div>
                  </div>
                </div>

                {user && (
                  <Link to={`/editar-imovel/${id}`}>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg mb-3">
                      Editar Imóvel
                    </Button>
                  </Link>
                )}
                
                <Link to="/imoveis">
                  <Button variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white py-6 text-lg">
                    Voltar
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default PropertyDetails;