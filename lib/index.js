const fs = require('fs');
const path = require('path');
const compress = require('lz-utils/lib/compress.js');

const hasOwn = function(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
};

const replace = function(str, obj, defaultValue) {
    str = `${str}`;
    if (!obj) {
        return str;
    }
    str = str.replace(/\{([^}{]+)\}/g, function(match, key) {
        if (!hasOwn(obj, key)) {
            if (typeof defaultValue !== 'undefined') {
                return defaultValue;
            }
            return match;
        }
        let val = obj[key];
        if (typeof val === 'function') {
            val = val(obj, key);
        }
        if (typeof val === 'undefined') {
            val = '';
        }
        return val;
    });
    return str;
};

module.exports = (_options = {}) => {

    const defaultOptions = {
        name: '',
        outputFile: '',
        heapSnapshots: null
    };

    const options = {
        ... defaultOptions,
        ... _options
    };


    const heapSnapshots = options.heapSnapshots;
    if (!heapSnapshots) {
        console.error('Invalid option: heapSnapshots');
        return;
    }

    const outputFile = options.outputFile;
    if (!outputFile) {
        console.error('Invalid option: outputFile');
        return;
    }

    const reportData = {
        name: options.name,
        heapSnapshots
    };

    const reportDataStr = compress(JSON.stringify(reportData));

    const templatePath = path.resolve(__dirname, 'template.html');
    const reportDistPath = path.resolve(__dirname, 'runtime/heap-reporter.js');
    const reportJs = fs.readFileSync(reportDistPath, {
        encoding: 'utf-8'
    });

    const content = `<script>\nwindow.reportData = '${reportDataStr}';\n${reportJs}\n</script>`;

    let html = fs.readFileSync(templatePath, {
        encoding: 'utf-8'
    });

    html = replace(html, {
        title: options.name || 'Heap Report',
        content: content
    });

    const htmlPath = path.resolve(outputFile);
    const htmlDir = path.dirname(htmlPath);
    if (!fs.existsSync(htmlDir)) {
        fs.mkdirSync(htmlDir, {
            recursive: true
        });
    }

    fs.writeFileSync(htmlPath, html);

    console.log(`saved html report: ${htmlPath}`);

};
