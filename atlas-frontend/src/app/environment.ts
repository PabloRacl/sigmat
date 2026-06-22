const hostname = window.location.hostname;
const isProd = hostname === 'atlas.sistemas.pm.pe.gov.br';
const isHomolog = hostname === 'atlashomolog.sistemas.pm.pe.gov.br';

export const environment = {
  production: isProd || isHomolog,
  apiUrl: isProd
    ? 'https://atlas.api.pm.pe.gov.br'
    : isHomolog
      ? 'https://atlashomolog.api.pm.pe.gov.br'
      : `http://${hostname}:3000`,
  apiAvatarUrl: 'https://fichafuncional.api.pm.pe.gov.br/FT0',
  mockAuth: !(isProd || isHomolog)
};

