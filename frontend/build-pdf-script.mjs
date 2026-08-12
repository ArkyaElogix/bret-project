import esbuild from 'esbuild';

esbuild.build({
    entryPoints: ['src/pages/scripts/renderReport.tsx'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: 'dist-pdf/renderReport.mjs', // <--- Change extension here
    external: [
        '@react-pdf/renderer',
        'react',
        'react-dom'
    ],
    format: 'esm', // <--- Change from 'cjs' to 'esm'
}).then(() => {
    console.log('PDF render script built to dist-pdf/renderReport.mjs');
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
