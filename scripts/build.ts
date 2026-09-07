import { build } from 'esbuild';

await build({
	entryPoints: [ 'src/index.ts' ],
	bundle: true,
	outdir: 'dist',
	target: 'es2022',
	format: 'esm',
	platform: 'neutral',
	minifySyntax: true,
	minifyWhitespace: true,
	sourcemap: true,
	sourcesContent: false,
});