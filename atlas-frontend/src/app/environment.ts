export const environment = {
  production: !window.location.hostname.includes('localhost'),
  apiUrl: window.location.hostname.includes('localhost')
    ? 'http://localhost:3000'
    : 'https://atlas-backend.vercel.app',
  mockAuth: window.location.hostname.includes('localhost')
};

