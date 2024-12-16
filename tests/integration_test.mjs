import { exec } from 'child_process';
import { expect } from 'chai';
import path from 'path';

const timeout = 5000;
const validDefsPath = path.join('tests', 'test_data', 'valid');
const invalidDefsPath = path.join('tests', 'test_data', 'invalid');
describe('Invalid defs', () => {
    it('should output all required params', (done) => {
        exec(`npm run validate-ddg-pixel-defs ${invalidDefsPath}`, (error, _, stderr) => {
            const pixelPath = path.join(invalidDefsPath, 'pixels', 'pixels.json');
            const expectedErrors = [
                `ERROR in ${pixelPath}: /invalid_pixel must have required property 'description'`,
                `ERROR in ${pixelPath}: /invalid_pixel must have required property 'owners'`,
                `ERROR in ${pixelPath}: /invalid_pixel must have required property 'triggers'`,
            ];

            const errors = stderr.trim().split('\n');
            expect(errors).to.include.members(expectedErrors);
            expect(error.code).to.equal(1);

            done();
        });
    }).timeout(timeout);
});

describe('Valid defs', () => {
    it('should exit normally', (done) => {
        exec(`npm run validate-ddg-pixel-defs ${validDefsPath}`, (error, _, stderr) => {
            expect(stderr.length).to.equal(0);
            expect(error).to.equal(null);

            done();
        });
    }).timeout(timeout);
});

describe('Invalid live pixel', () => {
    it('should output extra property error', (done) => {
        exec(
            `npm run validate-ddg-live-pixel ${validDefsPath} pixel_subfolder/test_pixels.json m.netp.tunnel.stop.failure /t/m_netp_tunnel_stop_failure_d_ios_phone?x=1`,
            (error, _, stderr) => {
                const expectedErrors = ["ERROR: must NOT have additional properties. Found extra property 'x'"];

                const errors = stderr.trim().split('\n');
                expect(errors).to.include.members(expectedErrors);
                expect(error.code).to.equal(1);

                done();
            },
        );
    }).timeout(timeout);
});

describe('Valid live pixel', () => {
    it('should exit normally', (done) => {
        exec(
            `npm run validate-ddg-live-pixel ${validDefsPath} pixel_subfolder/test_pixels.json m.netp.tunnel.stop.failure /t/m_netp_tunnel_stop_failure_d_ios_phone?ud5=1`,
            (error, _, stderr) => {
                expect(stderr.length).to.equal(0);
                expect(error).to.equal(null);

                done();
            },
        );
    }).timeout(timeout);
});
