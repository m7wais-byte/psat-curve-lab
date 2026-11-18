/* Dedicated local worker: no measurements leave the browser. */
importScripts('engine.js?v=13');
self.onmessage = ({ data }) => {
  const { requestId, points, degree } = data;
  try {
    const result = PV.deepFit(points, degree, (progress) =>
      self.postMessage({ requestId, type: 'progress', progress }),
    );
    self.postMessage({ requestId, type: 'result', ...result });
  } catch (error) {
    self.postMessage({ requestId, type: 'error', message: error.message });
  }
};
