
import React, { useState } from 'react';
import { useTranslation, LANGUAGES, Language } from '../i18n/config';
import { useAuth } from '../contexts/AuthContext';
import { Bars3Icon } from './icons';

interface HeaderProps {
  title: string;
  onMobileMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMobileMenuToggle }) => {
  const { t, language, setLanguage } = useTranslation();
  const { user, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  return (
    <header className="bg-secondary p-4 shadow-md flex justify-between items-center z-20 flex-shrink-0">
      <div className="flex items-center">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden text-highlight hover:text-light mr-4"
          aria-label="Open sidebar"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-light">{title}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-highlight hidden sm:inline">{t('header.welcomeUser', { name: user?.name || 'User' })}</span>
        
        <div className="relative">
          <button 
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            onBlur={() => setTimeout(() => setLangDropdownOpen(false), 150)}
            className="flex items-center space-x-2 text-highlight hover:text-light p-2 rounded-md bg-accent focus:outline-none focus:ring-2 focus:ring-brand"
            aria-haspopup="true"
            aria-expanded={langDropdownOpen}
          >
             <span>{LANGUAGES[language].flag}</span>
             <span className="hidden md:inline">{LANGUAGES[language].name}</span>
             <svg className={`w-4 h-4 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          {langDropdownOpen && (
             <div className="absolute right-0 mt-2 w-40 bg-secondary rounded-md shadow-lg z-20 border border-accent">
              <ul role="menu">
                {(Object.keys(LANGUAGES) as Language[]).map(lang => (
                   <li key={lang}>
                    <button 
                      role="menuitem"
                      onClick={() => {
                        setLanguage(lang);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-3 ${language === lang ? 'bg-brand text-white' : 'text-light hover:bg-accent'}`}
                    >
                      <span>{LANGUAGES[lang].flag}</span>
                      <span>{LANGUAGES[lang].name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="relative">
            <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                onBlur={() => setTimeout(() => setUserDropdownOpen(false), 150)}
                className="w-10 h-10 bg-brand rounded-full flex items-center justify-center font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary focus:ring-brand"
                aria-haspopup="true"
                aria-expanded={userDropdownOpen}
            >
                {user?.name.charAt(0).toUpperCase() || 'A'}
            </button>
             {userDropdownOpen && (
             <div className="absolute right-0 mt-2 w-48 bg-secondary rounded-md shadow-lg z-20 border border-accent">
              <div className="px-4 py-3 border-b border-accent">
                <p className="text-sm text-light font-semibold">{user?.name}</p>
                <p className="text-xs text-highlight truncate">{user?.email}</p>
              </div>
              <ul className="py-1" role="menu">
                <li>
                    <button 
                      role="menuitem"
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-light hover:bg-accent"
                    >
                      {t('auth.logout')}
                    </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
