interface R2Endpoint {
  id: string;
  workerEndpointUrl: string;
  workerEndpointApiKey: string;
  customDomain?: string;
}

export function getActiveEndpoint(): R2Endpoint | null {
  const activeEndpointId = localStorage.getItem('activeR2Endpoint');
  if (!activeEndpointId) return null;

  const endpoints = JSON.parse(localStorage.getItem('r2Endpoints') || '[]');
  return endpoints.find((endpoint: R2Endpoint) => endpoint.id === activeEndpointId) || null;
} 