const processShim = {
  env: {
    PUBLIC_URL: '',
  },
};

if (!(globalThis as any).process) {
  (globalThis as any).process = processShim;
} else if (!(globalThis as any).process.env) {
  (globalThis as any).process.env = processShim.env;
}

