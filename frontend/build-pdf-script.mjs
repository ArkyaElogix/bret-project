import esbuild from 'esbuild';

esbuild.build({
    entryPoints: ['src/pages/scripts/renderReport.tsx'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: 'dist-pdf/renderReport.mjs',
    external: [
        '@react-pdf/renderer',
        'react',
        'react-dom'
    ],
    // ADD THIS LOADER SECTION:
    loader: {
        '.jpeg': 'dataurl',
        '.jpg': 'dataurl',
        '.png': 'dataurl'
    },
    format: 'esm',
}).then(() => {
    console.log('PDF render script built to dist-pdf/renderReport.mjs');
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
