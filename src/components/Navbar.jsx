import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard, 
  Database,
  FileText,
  ChevronDown,
  UserCog,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navLinks = [
    {
      to: '/painel',
      label: 'Painel',
      icon: LayoutDashboard,
      type: 'link'
    },
    {
      label: 'Cadastros',
      icon: FileText,
      type: 'dropdown',
      children: [
        {
          to: '/imoveis',
          label: 'Imóveis',
          icon: Building2
        },
        {
          to: '/compradores',
          label: 'Compradores',
          icon: Users
        },
        {
          to: '/corretores',
          label: 'Corretores',
          icon: UserCog
        }
      ]
    },
    {
      to: '/financeiro',
      label: 'Financeiro',
      icon: DollarSign,
      type: 'link'
    },
    {
      to: '/backup',
      label: 'Backup',
      icon: Database,
      type: 'link'
    }
  ];

  return (
    <nav className="bg-emerald-800 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="https://horizons-cdn.hostinger.com/af40def5-0bd3-4296-b85b-d06d2baeac14/6c7af20940bda7a715211a778df1fdd6.png" 
              alt="L & T Imóbil" 
              className="h-12 w-auto object-contain" 
            />
            <h1 className="text-white text-lg font-bold">L & T Imobiliária</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {user && (
              <>
                {navLinks.map((link) => {
                  if (link.children) {
                    return (
                      <DropdownMenu key={link.label}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="text-white hover:text-emerald-200 hover:bg-emerald-700 data-[state=open]:bg-emerald-700">
                            <link.icon className="h-4 w-4 mr-2" />
                            {link.label}
                            <ChevronDown className="ml-1 h-3 w-3 opacity-70" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48 bg-white" align="end">
                          {link.children.map((child) => (
                            <Link key={child.to} to={child.to}>
                              <DropdownMenuItem className="cursor-pointer">
                                <child.icon className="h-4 w-4 mr-2 text-emerald-600" />
                                {child.label}
                              </DropdownMenuItem>
                            </Link>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }
                  
                  return (
                    <Link key={link.to} to={link.to}>
                      <Button variant="ghost" className="text-white hover:text-emerald-200 hover:bg-emerald-700">
                        <link.icon className="h-4 w-4 mr-2" />
                        {link.label}
                      </Button>
                    </Link>
                  );
                })}
                
                <div className="flex flex-col items-end justify-center ml-4 leading-none">
                  <span className="text-[10px] text-emerald-100 font-medium mb-1 mr-1">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                  <Button 
                    onClick={handleSignOut} 
                    variant="outline" 
                    size="sm" 
                    className="h-8 border-white text-white bg-transparent hover:bg-emerald-700 hover:border-emerald-700 hover:text-white"
                  >
                    <LogOut className="h-3 w-3 mr-2" />
                    Sair
                  </Button>
                </div>
              </>
            )}

            {!user && (
              <div className="flex items-center space-x-2 ml-4">
                <Link to="/login">
                  <Button variant="outline" className="border-white text-white hover:bg-emerald-700 hover:border-emerald-700">
                    Entrar
                  </Button>
                </Link>
                <Link to="/cadastro">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Cadastrar
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-white hover:text-emerald-200 hover:bg-emerald-700"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-emerald-800 border-t border-emerald-700"
          >
            <div className="px-4 py-4 space-y-2">
              {user && (
                <>
                  {navLinks.map((link) => {
                    if (link.children) {
                      return (
                        <div key={link.label} className="space-y-1">
                          <div className="px-4 py-2 text-sm font-semibold text-emerald-200 flex items-center opacity-80">
                            <link.icon className="h-4 w-4 mr-2" />
                            {link.label}
                          </div>
                          {link.children.map((child) => (
                            <Link 
                              key={child.to} 
                              to={child.to} 
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Button 
                                variant="ghost" 
                                className="w-full justify-start text-white hover:text-emerald-200 hover:bg-emerald-700 pl-8"
                              >
                                <child.icon className="h-4 w-4 mr-2" />
                                {child.label}
                              </Button>
                            </Link>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <Link 
                        key={link.to} 
                        to={link.to} 
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-white hover:text-emerald-200 hover:bg-emerald-700"
                        >
                          <link.icon className="h-4 w-4 mr-2" />
                          {link.label}
                        </Button>
                      </Link>
                    );
                  })}
                  
                  <div className="pt-2 border-t border-emerald-700 mt-2">
                    <div className="px-4 mb-2 text-xs text-emerald-200 text-right">
                      Logado como: <span className="font-semibold text-white">{user.user_metadata?.full_name || user.email}</span>
                    </div>
                    <Button 
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }} 
                      variant="outline" 
                      className="w-full border-white text-white bg-transparent hover:bg-emerald-700 hover:border-emerald-700 hover:text-white"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </>
              )}

              {!user && (
                <div className="space-y-2 pt-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-white text-white hover:bg-emerald-700 hover:border-emerald-700">
                      Entrar
                    </Button>
                  </Link>
                  <Link to="/cadastro" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      Cadastrar
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;