if (typeof window !== 'undefined') {
  window.global = window;
  window.process = {
    env: { NODE_ENV: 'development' }
  };
  window.Buffer = window.Buffer || require('buffer').Buffer;
} 