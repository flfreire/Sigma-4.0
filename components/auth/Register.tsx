
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../i18n/config';
import { WrenchScrewdriverIcon } from '../icons';

interface RegisterProps {
  onToggleView: () => void;
}

const Register: React.FC<RegisterProps> = ({ onToggleView }) => {
  const { t } = useTranslation();
  const { register, error, isLoading, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    try {
      await register(name, email, password);
      setSuccessMessage(t('auth.registrationSuccess'));
      setTimeout(() => {
          onToggleView();
          clearError();
      }, 2000);
    } catch (e) {
      // Error is set in context
    }
  };
  
  const handleToggleView = () => {
    clearError();
    onToggleView();
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <WrenchScrewdriverIcon className="h-16 w-16 text-brand mx-auto" />
        <h1 className="text-4xl font-bold text-light mt-2">SIGMA 4.0</h1>
        <p className="text-highlight">{t('auth.registerTitle')}</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-secondary shadow-2xl rounded-lg px-8 pt-6 pb-8 mb-4 border border-accent">
        {error && <p className="text-red-500 text-center text-sm mb-4">{error}</p>}
        {successMessage && <p className="text-green-500 text-center text-sm mb-4">{successMessage}</p>}
        <div className="mb-4">
          <label className="block text-highlight text-sm font-bold mb-2" htmlFor="name">
            {t('auth.nameLabel')}
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 bg-primary border-accent text-light leading-tight focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div className="mb-4">
          <label className="block text-highlight text-sm font-bold mb-2" htmlFor="email">
            {t('auth.emailLabel')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 bg-primary border-accent text-light leading-tight focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div className="mb-6">
          <label className="block text-highlight text-sm font-bold mb-2" htmlFor="password">
            {t('auth.passwordLabel')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="shadow appearance-none border rounded w-full py-2 px-3 bg-primary border-accent text-light mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-brand hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:bg-gray-500 flex justify-center items-center"
          >
            {isLoading ? (
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : t('auth.registerButton')}
          </button>
        </div>
        <div className="text-center mt-6">
          <button type="button" onClick={handleToggleView} className="inline-block align-baseline font-bold text-sm text-brand hover:text-blue-400">
            {t('auth.toggleToLogin')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;
