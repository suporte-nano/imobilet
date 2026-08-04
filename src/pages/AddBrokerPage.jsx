import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BrokerForm from '@/components/BrokerForm';

const AddBrokerPage = () => {
  return (
    <>
      <Helmet>
        <title>Novo Corretor - L & T Imóbil</title>
        <meta name="description" content="Cadastrar novo corretor no sistema" />
      </Helmet>

      <div className="min-h-screen bg-emerald-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center text-sm text-gray-600 mb-6"
          >
            <Link to="/painel" className="hover:text-emerald-600">Painel</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link to="/corretores" className="hover:text-emerald-600">Corretores</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-emerald-600 font-medium">Novo Corretor</span>
          </motion.div>

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Cadastrar Novo Corretor</h1>
            <p className="text-lg text-gray-600">Preencha os dados do corretor para cadastrá-lo no sistema</p>
          </motion.div>

          {/* Form */}
          <BrokerForm mode="create" />
        </div>

        <Footer />
      </div>
    </>
  );
};

export default AddBrokerPage;