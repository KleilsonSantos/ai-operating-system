export default {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{js,cjs,mjs,json,md,yml,yaml}': ['prettier --write'],
};
