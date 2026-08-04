import React from 'react';
import { Link } from 'react-router-dom';
import { Bed, Bath, Car, Maximize } from 'lucide-react';
import { motion } from 'framer-motion';
import { normalizeFileArray } from '@/lib/dataMigration';

const PropertyCard = ({ property }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  // Safely extract the first image URL from JSONB structure.
  // The normalized objects contain the URL, which correctly points to the sanitized path in storage.
  const images = normalizeFileArray(property.images);
  const imageUrl = images.length > 0 && images[0].url 
    ? images[0].url 
    : 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      <Link to={`/imoveis/${property.id}`}>
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute top-4 right-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {property.property_type}
          </div>
        </div>
        
        <div className="p-5">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{property.title}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{property.description}</p>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-emerald-600">{formatPrice(property.price)}</span>
          </div>
          
          <div className="flex items-center justify-between text-gray-600 text-sm border-t pt-4">
            <div className="flex items-center space-x-1">
              <Bed className="h-4 w-4" />
              <span>{property.bedrooms || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Bath className="h-4 w-4" />
              <span>{property.bathrooms || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Car className="h-4 w-4" />
              <span>{property.garage_spaces || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Maximize className="h-4 w-4" />
              <span>{property.area || 0}m²</span>
            </div>
          </div>
          
          <p className="text-gray-500 text-xs mt-3">
            {property.address_neighborhood || 'Bairro não inf.'}, {property.address_city || 'Cidade não inf.'}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

export default PropertyCard;