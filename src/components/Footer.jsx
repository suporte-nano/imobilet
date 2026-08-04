import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-emerald-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <img 
                src="https://horizons-cdn.hostinger.com/af40def5-0bd3-4296-b85b-d06d2baeac14/6c7af20940bda7a715211a778df1fdd6.png" 
                alt="L & T Imóbil" 
                className="h-16 w-auto object-contain bg-white rounded-lg p-1" 
              />
            </div>
            <p className="text-emerald-200">
              Sua plataforma completa para compra e venda de imóveis. Encontre o imóvel dos seus sonhos com a gente.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-emerald-200 hover:text-white transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/imoveis" className="text-emerald-200 hover:text-white transition-colors">
                  Imóveis
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-emerald-200 hover:text-white transition-colors">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-emerald-200 text-sm">
                <Mail className="h-4 w-4 text-emerald-300 flex-shrink-0" />
                <span>loteseterrenosmcz19@gmail.com</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-200 text-sm">
                <Phone className="h-4 w-4 text-emerald-300 flex-shrink-0" />
                <span>(82) 99636-2642 / 99946-0044</span>
              </li>
              <li className="flex items-start gap-2 text-emerald-200 text-sm">
                <MapPin className="h-4 w-4 text-emerald-300 flex-shrink-0 mt-0.5" />
                <span>Loteamento Mar Azul, Quadra 19, Lote 01<br />CEP 57935-000 Paripueira - AL</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-emerald-700 mt-8 pt-8 text-center text-emerald-200">
          <p>© 2025 L & T Imóbiliária - Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;