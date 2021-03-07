import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';

const Headers = (props) => (
  <HelmetProvider>
    <Helmet>
      <title>{props.title}</title>
    </Helmet>
  </HelmetProvider>
);

export default Headers;
