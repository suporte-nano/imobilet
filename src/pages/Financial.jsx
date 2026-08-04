import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { DollarSign, ArrowDown, ArrowUp, LayoutDashboard } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
const Financial = () => {
  return <>
      <Helmet>
        <title>Financeiro - L & T Imóbil</title>
        <meta name="description" content="Módulo financeiro da L & T Imobiliária" />
      </Helmet>

      <div className="min-h-screen bg-emerald-50 flex flex-col">
        <Navbar />

        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <DollarSign className="h-8 w-8 text-emerald-600 mr-3" />
              Financeiro
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12">
            <Link to="/financeiro/a-pagar">
              <motion.div whileHover={{
              y: -5,
              scale: 1.02
            }} whileTap={{
              scale: 0.98
            }} initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.3
            }} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-8 flex flex-col items-center justify-center text-center border-2 border-transparent hover:border-red-100 group h-64">
                <div className="bg-red-50 p-5 rounded-full mb-4 group-hover:bg-red-100 transition-colors">
                  <ArrowDown className="h-10 w-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">À Pagar</h2>
                <p className="text-gray-500">
                  Gerencie despesas, contas, fornecedores e comissões da imobiliária.
                </p>
              </motion.div>
            </Link>

            <Link to="/financeiro/a-receber">
              <motion.div whileHover={{
              y: -5,
              scale: 1.02
            }} whileTap={{
              scale: 0.98
            }} initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.3,
              delay: 0.1
            }} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-8 flex flex-col items-center justify-center text-center border-2 border-transparent hover:border-emerald-100 group h-64">
                <div className="bg-emerald-50 p-5 rounded-full mb-4 group-hover:bg-emerald-100 transition-colors">
                  <ArrowUp className="h-10 w-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">À Receber</h2>
                <p className="text-gray-500">
                  Acompanhe entradas, recebimentos, vendas e aluguéis.
                </p>
              </motion.div>
            </Link>
          </div>

          <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.4
        }} className="flex justify-center mt-12">
            <Link to="/painel" className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <LayoutDashboard className="h-5 w-5 mr-2" />
              Voltar ao Painel Geral
            </Link>
          </motion.div>
        </div>

        <Footer />
      </div>
    </>;
};
export default Financial;