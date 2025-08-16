
import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);

  const toggleView = () => setIsLoginView(prev => !prev);

  return (
    <div className="min-h-screen bg-primary flex flex-col justify-center items-center p-4 selection:bg-brand selection:text-white">
        {isLoginView ? <Login onToggleView={toggleView} /> : <Register onToggleView={toggleView} />}
    </div>
  );
};

export default AuthPage;
