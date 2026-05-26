export const environment = {
  production: !window.location.hostname.includes('localhost'),
  apiUrl: window.location.hostname.includes('localhost')
    ? 'http://localhost:3001'
    : 'https://sigmat-backend.vercel.app'
};

