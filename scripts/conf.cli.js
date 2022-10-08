//starfall-cli config
//https://github.com/cenfun/starfall-cli

const fs = require('fs');
const path = require('path');

module.exports = {

    build: {

        before: (item, Util) => {
            if (item.name === 'worker') {
                return new Promise((resolve) => {

                    //'../node_modules/chrome-devtools-frontend/front_end/core/platform/generate-dcheck.js'
                    const dcheckPath = path.resolve(__dirname, '../node_modules/chrome-devtools-frontend/front_end/core/platform/dcheck.js');
                    fs.writeFileSync(dcheckPath, 'export function DCHECK(condition, message) {}');

                    //i18n.js
                    const i18nPath = path.resolve(__dirname, '../node_modules/chrome-devtools-frontend/front_end/core/i18n/i18n.js');
                    fs.writeFileSync(i18nPath, `
                    const i18n = {
                        serializeUIString: (v) => {
                            return v;
                        }
                    }
                    export { i18n }
                    `);


                    const entryPoints = ['./node_modules/chrome-devtools-frontend/front_end/entrypoints/heap_snapshot_worker/HeapSnapshot.ts'];
                    const outfile = path.resolve(item.buildPath, 'heap-snapshot.js');
                    //console.log(outfile);
                    //const outdir = path.dirname(outfile);

                    // const plugin = {
                    //     name: 'devtools-plugin',
                    //     setup(build) {
                    //         // https://esbuild.github.io/plugins/#on-resolve
                    //         build.onResolve({
                    //             filter: /.*/
                    //         }, (args) => {
                    //             // const filename = path.basename(args.path);
                    //             // if (filename === 'i18n.js') {
                    //             //     return {
                    //             //         path: filename
                    //             //     };
                    //             // }

                    //         });
                    //     }
                    // };

                    require('esbuild').build({
                        entryPoints,
                        outfile,
                        treeShaking: false,
                        bundle: true,
                        //minify: true,
                        target: 'es2020',
                        format: 'esm',
                        platform: 'browser',
                        //plugins: [plugin],
                        metafile: true
                    }).then((result) => {

                        const metaPath = path.resolve(item.buildPath, 'meta.json');
                        fs.writeFileSync(metaPath, JSON.stringify(result.metafile, null, 4));
                        Util.logGreen(`saved metafile: ${metaPath}`);

                        resolve(0);
                    }).catch((err) => {
                        console.error('failed to run esbuild:', err);
                        resolve(1);
                    });

                });
            }

            return 0;
        },

        after: (item, Util) => {

            if (item.name === 'worker') {
                //trigger build app too
                const indexJs = path.resolve(__dirname, '../packages/app/src/index.js');
                const content = Util.readFileContentSync(indexJs);
                Util.writeFileContentSync(indexJs, content);
                return 0;
            }

            if (item.name === 'app' && item.production) {
                const filename = `${item.fullName}.js`;
                //copy dist file to lib
                const fromJs = path.resolve(item.buildPath, filename);
                if (!fs.existsSync(fromJs)) {
                    Util.logRed(`ERROR: Not found dist: ${fromJs}`);
                    return 1;
                }
                const toPath = path.resolve(__dirname, '../lib/runtime');
                if (!fs.existsSync(toPath)) {
                    fs.mkdirSync(toPath);
                }
                const toJs = path.resolve(toPath, filename);
                //console.log(fromJs, toJs);
                fs.cpSync(fromJs, toJs);

                Util.logGreen(`Copied: ${toJs}`);
            }

            return 0;
        }
    }
};
