import { expect } from 'chai';

import { ParamsValidator } from '../src/params_validator.mjs';

describe('No common params nor suffixes', () => {
    const paramsValidator = new ParamsValidator('{}', '{}');
    const pixelDefs = {
        simplePixel: {
            parameters: [
                {
                    key: 'param1',
                    type: 'boolean',
                },
            ],
        },
    };

    it('no params should pass', () => {
        const prefix = 'simplePixel';
        const url = `/t/${prefix}`;
        const errors = paramsValidator.validateLivePixels(pixelDefs[prefix], prefix, url);
        expect(errors).to.be.empty;
    });

    it('conforming pixel should pass', () => {
        const prefix = 'simplePixel';
        const url = `/t/${prefix}?param1=true`;
        const errors = paramsValidator.validateLivePixels(pixelDefs[prefix], prefix, url);
        expect(errors).to.be.empty;
    });

    it('wrong type should fail', () => {
        const prefix = 'simplePixel';
        const url = `/t/${prefix}?param1=not_a_bool`;
        const errors = paramsValidator.validateLivePixels(pixelDefs[prefix], prefix, url);

        const expectedErrors = ['/param1 must be boolean'];
        expect(errors).to.have.members(expectedErrors);
    });

    it('extra param should fail', () => {
        const prefix = 'simplePixel';
        const url = `/t/${prefix}?param1=true&param2=x`;
        const errors = paramsValidator.validateLivePixels(pixelDefs[prefix], prefix, url);

        const expectedErrors = ["must NOT have additional properties. Found extra property 'param2'"];
        expect(errors).to.have.members(expectedErrors);
    });

    it('ignores cache buster', () => {
        const prefix = 'simplePixel';
        const url = `/t/${prefix}?12345&param1=true`;
        const errors = paramsValidator.validateLivePixels(pixelDefs[prefix], prefix, url);
        expect(errors).to.be.empty;
    });
});

describe('Common params', () => {
    const commonParams = {
        common: {
            key: 'common',
            type: 'integer',
            minimum: 0,
            maximum: 100,
        },
    };
    const paramsValidator = new ParamsValidator(commonParams, '{}');
    const prefix = 'simplePixel';
    const pixelDefs = {
        simplePixel: {
            parameters: [
                'common',
                {
                    key: 'param1',
                    type: 'boolean',
                },
            ],
        },
    };

    it('common param only should pass', () => {
        const url = `/t/${prefix}?common=42`;
        const errors = paramsValidator.validateLivePixels(pixelDefs[prefix], prefix, url);
        expect(errors).to.be.empty;
    });

    it('both common and custom params should pass', () => {
        const url = `/t/${prefix}?param1=false&common=0`;
        const errors = paramsValidator.validateLivePixels(pixelDefs[prefix], prefix, url);
        expect(errors).to.be.empty;
    });

    it('wrong common type should fail', () => {
        const url = `/t/${prefix}?common=200`;
        const errors = paramsValidator.validateLivePixels(pixelDefs[prefix], prefix, url);

        const expectedErrors = ['/common must be <= 100'];
        expect(errors).to.have.members(expectedErrors);
    });
});

describe('Common suffixes', () => {
    const commonSuffixes = {
        exception: {
            key: 'exception',
        },
    };
    const paramsValidator = new ParamsValidator('{}', commonSuffixes);
    const prefix = 'simplePixel';
    const pixelDefs = {
        simplePixel: {
            suffixes: [
                'exception',
                {
                    enum: [1, 2, 3],
                },
            ],
        },
    };

    it('both common and custom suffix should pass', () => {
        const url = `/t/${prefix}.exception.anystring.1`;
        const errors = paramsValidator.validateLivePixels(pixelDefs[prefix], prefix, url);
        expect(errors).to.be.empty;
    });

    it('unexpected value should fail', () => {
        const url = `/t/${prefix}.wrongkey.anystring.1`;
        const errors = paramsValidator.validateLivePixels(pixelDefs[prefix], prefix, url);

        const expectedErrors = ["Suffix 'wrongkey' at index 0 /0 must be equal to one of the allowed values"];
        expect(errors).to.have.members(expectedErrors);
    });

    it('missing part of name should NOT fail', () => {
        const url = `/t/${prefix}.exception.1`;
        const errors = paramsValidator.validateLivePixels(pixelDefs[prefix], prefix, url);

        const expectedErrors = [];
        expect(errors).to.have.members(expectedErrors);
    });

    it('extra suffix should fail', () => {
        const url = `/t/${prefix}.exception.anystring.1.extra`;
        const errors = paramsValidator.validateLivePixels(pixelDefs[prefix], prefix, url);

        const expectedErrors = ["must NOT have additional properties. Found extra suffix 'extra' at index 3"];
        expect(errors).to.have.members(expectedErrors);
    });
});
