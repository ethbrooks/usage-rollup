const API_URL = 'https://wellsfargo.com/api/v1/usage/rollups';
const API_KEY = 'usg_4f107d2d5e44ad2ed2a7c4403163d5c474d846d439aa7bad';

export async function sendUsage(payload) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Usage submission failed: HTTP ${response.status}`);
  }

  return response.status;
}
