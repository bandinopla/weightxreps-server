export const isCrossOriginRequest = (req) => {
    const requestOrigin = req.get('origin');
    const serverHost = `${req.protocol}://${req.get('host')}`;
    return requestOrigin && requestOrigin !== serverHost;
  };