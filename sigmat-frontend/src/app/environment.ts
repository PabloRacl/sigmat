export const environment = {
  production: !window.location.hostname.includes('localhost'),
  apiUrl: window.location.hostname.includes('localhost')
    ? 'http://localhost:3000'
    : 'https://sigmat-backend.vercel.app'
};

