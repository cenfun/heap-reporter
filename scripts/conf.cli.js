//starfall-cli config
//https://github.com/cenfun/starfall-cli

const fs = require('fs');
const path = require('path');

module.exports = {

    build: {

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
