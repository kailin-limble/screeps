import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/main.js',
  output: {
    dir: 'dist/main.js',
    format: 'cjs'
  },
  plugins: [nodeResolve()]
};