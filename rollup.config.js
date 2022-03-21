import { nodeResolve as resolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';


export default {
    input: './assets/js/app.js',

    watch: {
        include: './assets/js/app.js',
        clearScreen: false
    },

    plugins: [
        json(),
        resolve({
            browser: true
        }),
        commonjs(),
        terser()
    ],

    output: {
        file: './public/js/app.js',
        format: 'iife',
        sourcemap: false
    }
};
