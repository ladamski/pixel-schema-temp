import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

import { formatAjvErrors } from './error_utils.mjs';

/**
 * Validator for pixel parameters and suffixes:
 * 1) ensures they can be used as schemas themselves to validate live pixels
 * 2) validates shortcuts
 * 3) validates live pixels
 */
export class ParamsValidator {
    #ajv = new Ajv2020({ allErrors: true, coerceTypes: true });
    #commonParams;
    #commonSuffixes;

    constructor(commonParams, commonSuffixes) {
        this.#commonParams = commonParams;
        this.#commonSuffixes = commonSuffixes;

        addFormats(this.#ajv);
        this.#ajv.addKeyword('key');
        this.#ajv.addKeyword('keyPattern');
    }

    /**
     * Helper function to replace shortcuts
     * @param {string} item - shortcut to a param/suffix
     * @param {*} common - object containing common params/suffixes
     * @returns updated param/suffix
     */
    replaceCommonPlaceholder(item, common) {
        if (!common[item]) throw new Error(`invalid shortcut '${item}' - please update common params/suffixes`);

        return common[item];
    }

    /**
     * Updates enum values to strings
     * This is needed to ensure cases like enum = [1, 2, 3] can be properly validated
     * against live pixels (which will be strings)
     * @param {*} item - param/suffix
     */
    castEnumsToString(item) {
        if (item.enum) {
            item.enum = item.enum.map((val) => val.toString());
        }
    }

    /**
     * Helper function to replace shortcuts and ensure String types by default
     * @param {*} item - shortcut or a param/suffix
     * @param {*} common - object containing common params/suffixes
     * @returns updated param/suffix
     */
    getUpdatedItem(item, common) {
        const updatedItem = typeof item === 'string' ? this.replaceCommonPlaceholder(item, common) : item;
        this.castEnumsToString(updatedItem);

        // default type is string
        updatedItem.type = updatedItem.type || 'string';
        return updatedItem;
    }

    /**
     * Replaces shortcuts to common suffixes and compiles the suffix schema
     * @param {*} suffixes
     * @returns an ajv compiled schema
     * @throws if any errors are found
     */
    compileSuffixesSchema(suffixes) {
        if (!suffixes) return this.#ajv.compile({});

        const properties = {};
        let idx = 0;
        suffixes.forEach((item) => {
            const suffix = this.getUpdatedItem(item, this.#commonSuffixes);
            if (suffix.key) {
                // If suffix contains a key, we set it as an enum
                // to use as a static portion of the pixel name
                properties[idx] = { enum: [suffix.key] };
                idx++;
            }

            properties[idx] = suffix;
            idx++;
        });

        const pixelNameSchema = {
            type: 'object',
            properties,
            additionalProperties: false,
            required: Object.keys(properties),
        };

        return this.#ajv.compile(pixelNameSchema);
    }

    /**
     * Replaces shortcuts to common params and compiles the parameters schema
     * @param {*} parameters
     * @returns an ajv compiled schema
     * @throws if any errors are found
     */
    compileParamsSchema(parameters) {
        if (!parameters) return this.#ajv.compile({});

        const properties = {};
        const patternProperties = {};
        parameters
            .map((param) => this.getUpdatedItem(param, this.#commonParams))
            .forEach((param) => {
                if (param.keyPattern) {
                    if (patternProperties[param.keyPattern]) {
                        throw new Error(`duplicate keyPattern '${param.keyPattern}' found!`);
                    }
                    patternProperties[param.keyPattern] = param;
                } else {
                    if (properties[param.key]) {
                        throw new Error(`duplicate key '${param.key}' found!`);
                    }
                    properties[param.key] = param;
                }
            });

        const pixelParams = {
            type: 'object',
            properties,
            patternProperties,
            additionalProperties: false,
        };

        return this.#ajv.compile(pixelParams);
    }

    // TODO: this function is a rough PoC, will be hashed out in
    // https://app.asana.com/0/1205243787707480/1207703134691882/f
    validateLivePixels(pixelDef, prefix, url) {
        const errors = [];

        const urlSplit = url.split('/')[2].split('?');
        const livePixelName = urlSplit[0].replaceAll('_', '.');
        // grab pixel parameters with any preciding cache buster removed
        const livePixelRequestParams = /^([0-9]+&)?(.*)$/.exec(urlSplit[1] || '')[2];

        // 1) Validate pixel name if it's parameterized
        if (livePixelName.length > prefix.length) {
            const pixelSuffix = livePixelName.split(`${prefix}.`)[1];
            const pixelNameStruct = {};
            pixelSuffix.split('.').forEach((suffix, idx) => {
                pixelNameStruct[idx] = suffix;
            });
            const validatePixelName = this.compileSuffixesSchema(pixelDef.suffixes);
            validatePixelName(pixelNameStruct);
            errors.push(...formatAjvErrors(validatePixelName.errors));
        }

        // 2) Validate pixel params
        const validateParams = this.compileParamsSchema(pixelDef.parameters);
        const paramsStruct = Object.fromEntries(new URLSearchParams(livePixelRequestParams));
        validateParams(paramsStruct);
        errors.push(...formatAjvErrors(validateParams.errors));

        return errors;
    }
}
