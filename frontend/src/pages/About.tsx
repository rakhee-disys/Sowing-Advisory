import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const About = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Open external website in a new tab
    window.open('https://dexian.com/about-us/', '_blank');

    // Navigate back to the Home page after opening the external link
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg text-gray-600">Redirecting to About Us...</p>
    </div>
  );
};
