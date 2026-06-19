export const environment = {
  production: !window.location.hostname.includes('localhost'),
  apiUrl: window.location.hostname.includes('localhost')
    ? 'http://localhost:3000'
    : 'https://atlas.api.pm.pe.gov.br',
  apiAvatarUrl: 'https://fichafuncional.api.pm.pe.gov.br/FT0',
  mockAuth: window.location.hostname.includes('localhost')
};

