import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Building2, Users, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const Home = () => {
  const features = [
    {
      icon: Search,
      title: 'Busca Avançada',
      description: 'Encontre o imóvel perfeito com nossos filtros detalhados',
    },
    {
      icon: Building2,
      title: 'Amplo Catálogo',
      description: 'Centenas de imóveis disponíveis em diversas regiões',
    },
    {
      icon: Users,
      title: 'Gestão de Clientes',
      description: 'Sistema completo para gerenciar seus compradores',
    },
    {
      icon: Shield,
      title: 'Segurança',
      description: 'Plataforma segura e confiável para suas transações',
    },
  ];

  return (
    <>
      <Helmet>
        <title>L & T Imóbil - Encontre o Imóvel dos Seus Sonhos</title>
        <meta name="description" content="Plataforma completa para compra e venda de imóveis. Encontre casas, apartamentos e terrenos com facilidade." />
      </Helmet>
      
      <div className="min-h-screen bg-emerald-50">
        <Navbar />
        
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                  Encontre o <span className="text-emerald-600">Imóvel Perfeito</span> para Você
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  A plataforma mais completa para compra e venda de imóveis. Milhares de opções, filtros avançados e atendimento personalizado.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/imoveis">
                    <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg w-full sm:w-auto">
                      Ver Imóveis
                    </Button>
                  </Link>
                  <Link to="/cadastro">
                    <Button size="lg" variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white px-8 py-6 text-lg w-full sm:w-auto">
                      Cadastrar-se
                    </Button>
                  </Link>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <img alt="Modern luxury house with pool" className="rounded-2xl shadow-2xl" src="https://images.unsplash.com/photo-1670589953903-b4e2f17a70a9" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Por que escolher a L & T Imóbil?
              </h2>
              <p className="text-lg text-gray-600">
                A melhor plataforma para suas necessidades imobiliárias
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="bg-emerald-600 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-emerald-600">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Pronto para começar?
              </h2>
              <p className="text-lg text-emerald-100 mb-8">
                Cadastre-se agora e tenha acesso completo à nossa plataforma
              </p>
              <Link to="/cadastro">
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 px-8 py-6 text-lg">
                  Criar Conta Grátis
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Home;