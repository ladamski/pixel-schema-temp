import fs from 'fs';
import JSON5 from 'json5';

import { ParamsValidator } from '../src/params_validator.mjs';
import { logErrors } from '../src/error_utils.mjs';
import { spawnSync } from 'child_process';

const clickhouseHost = process.env.CLICKHOUSE_HOST

const args = process.argv.slice(2);
const mainDir = args[0];

const productDef = JSON5.parse(fs.readFileSync(`${mainDir}/product.json`).toString());
// Whether to force all schemas and pixels to lowercase
const forceLowerCase = productDef.forceLowerCase;

const pixelDefs = JSON5.parse(getNormalizedCase(fs.readFileSync(`${mainDir}/pixels/${args[1]}`).toString()));
const commonParams = JSON5.parse(getNormalizedCase(fs.readFileSync(`${mainDir}/common_params.json`).toString()));
const ignoreParams = JSON5.parse(getNormalizedCase(fs.readFileSync(`${mainDir}/ignore_params.json`).toString()));
const commonSuffixes = JSON5.parse(getNormalizedCase(fs.readFileSync(`${mainDir}/common_suffixes.json`).toString()));
const paramsValidator = new ParamsValidator(commonParams, commonSuffixes);

function main() {
    console.log(`Processing pixels defined in ${args[1]}`)

    if (args[2]) {
        const prefix = args[2];
        const url = args[3];

        console.log('Validating', prefix)
        validateSinglePixel(pixelDefs, prefix, url);
    } else {
        if (!clickhouseHost) {
            console.error('Please set CLICKHOUSE_HOST in your ENV');
            process.exit(1);
        }
        const pixelQueryResults = queryClickhouse(pixelDefs);
        for (const prefix of Object.keys(pixelQueryResults)) {
            console.log('Validating', prefix)
            validateQueryForPixels(prefix, pixelQueryResults[prefix], paramsValidator)
        }
    }
}

function queryClickhouse(pixelDefs) {
    let agents = "'" + productDef.agents.join("','") + "'";
    const agentString = productDef.agents.length ? `AND agent IN (${agents})` : '';

    const pixelQueryResults = {};
    for(const pixel of Object.keys(pixelDefs)) {
        console.log('Querying for', pixel)
        const pixelID = pixel.split(/[-.]/)[0];
        const queryString = `SELECT DISTINCT request FROM metrics.pixels WHERE pixel_id = '${pixelID}' AND date > now() - INTERVAL 30 DAY AND pixel ILIKE '${pixel}%' ${agentString} LIMIT 1000`;
        const clickhouseQuery = spawnSync( 'clickhouse-client', [ '--host',  clickhouseHost, '--query', queryString ] );
        const resultString = clickhouseQuery.stdout.toString();
        const resultErr = clickhouseQuery.stderr.toString();
        if (resultErr) {
            console.log( 'clickhouse query error:', resultErr );
        } else {
            if (resultString) pixelQueryResults[pixel] = resultString;
        }
    }

    return pixelQueryResults;
}

function validateQueryForPixels(prefix, pixelQuery, paramsValidator) {
    let minVersion = productDef.target;

    const lines = pixelQuery.split('\n');
    console.log(`Received ${lines.length} results`)
    for (let line of lines) {
        if (line === '') continue;
        line = getNormalizedCase(line);
        const pixelRequest = line.split('/')[2];
        const pixelDef = pixelDefs[prefix];

        logErrors(`ERROR for '${pixelRequest}\n`, paramsValidator.validateLivePixels(pixelDef, prefix, line, ignoreParams, minVersion));
    }
}

function validateSinglePixel(pixelDefs, prefix, url) {
    logErrors('ERROR:', paramsValidator.validateLivePixels(pixelDefs[prefix], prefix, url));
}

function getNormalizedCase(value) {
    if (forceLowerCase) {
        return value.toLowerCase();
    }

    return value;

}
main();