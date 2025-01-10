#!/usr/bin/env node

import fs from 'fs';
import JSON5 from 'json5';

import { ParamsValidator } from '../src/params_validator.mjs';
import { logErrors } from '../src/error_utils.mjs';

// TODO: this script is a rough PoC, will be hashed out in
// https://app.asana.com/0/1205243787707480/1207703134691882/f
function main() {
    const args = process.argv.slice(2);
    const mainDir = args[0];

    const pixelDefs = JSON5.parse(fs.readFileSync(`${mainDir}/pixels/${args[1]}`));
    const commonParams = JSON5.parse(fs.readFileSync(`${mainDir}/common_params.json`));
    const commonSuffixes = JSON5.parse(fs.readFileSync(`${mainDir}/common_suffixes.json`));
    const paramsValidator = new ParamsValidator(commonParams, commonSuffixes);

    if (fs.existsSync(args[2])) {
        const file = fs.readFileSync(args[2], 'utf8');
        const lines = file.split('\n');
        for (const line of lines) {
            console.log(line);
            const parts = line.split(' ');
            const prefix = parts[0];
            const url = parts[1];
            const pixelDef = pixelDefs[prefix];

            logErrors('ERROR:', paramsValidator.validateLivePixels(pixelDef, prefix, url));
        }
    } else {
        const prefix = args[2];
        const url = args[3];

        logErrors('ERROR:', paramsValidator.validateLivePixels(pixelDefs[prefix], prefix, url));
    }
}

main();
