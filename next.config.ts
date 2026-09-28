import type { NextConfig } from 'next';

const config: NextConfig = {
  // Profiles are read from disk when GitHub isn't configured, so ship them with the functions.
  outputFileTracingIncludes: { '/**': ['./profiles/**/*'] },
};

export default config;
