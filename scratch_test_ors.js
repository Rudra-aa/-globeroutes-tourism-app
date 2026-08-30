const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImQ2NmFhZjk5ZDQxMjRmZmI4Nzg4OGU1NGNkY2I0MTJiIiwiaCI6Im11cm11cjY0In0=';
const start = '77.209,28.6139'; // Delhi
const end = '72.8777,19.0760'; // Mumbai

async function test() {
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${start}&end=${end}`;
  try {
    const res = await fetch(url);
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Keys:', Object.keys(data));
    if (data.features && data.features[0]) {
      const feat = data.features[0];
      console.log('Feature keys:', Object.keys(feat));
      console.log('Properties:', JSON.stringify(feat.properties, null, 2).slice(0, 1000));
      console.log('Geometry Type:', feat.geometry.type);
      console.log('Number of coordinates:', feat.geometry.coordinates.length);
    } else {
      console.log('No features found. Full response:', JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
