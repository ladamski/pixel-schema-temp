import { exec } from 'child_process';
import { expect } from 'chai';

const timeout = 5000;
describe('Invalid defs', () => {
    it('should output all required params', (done) => {
        exec('npm run validate-ddg-pixel-defs tests/test_data/invalid', (error, _, stderr) => {
            const expectedErrors = [
                "ERROR in pixels.json: /invalid_pixel must have required property 'description'",
                "ERROR in pixels.json: /invalid_pixel must have required property 'owners'",
                "ERROR in pixels.json: /invalid_pixel must have required property 'triggers'",
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
        exec('npm run validate-ddg-pixel-defs tests/test_data/valid', (error, _, stderr) => {
            expect(stderr.length).to.equal(0);
            expect(error).to.equal(null);

            done();
        });
    }).timeout(timeout);
});

describe('Invalid live pixel', () => {
    it('should output extra property error', (done) => {
        exec(
            'npm run validate-ddg-live-pixel tests/test_data/valid test_pixels.json m.netp.tunnel.stop.failure /t/m_netp_tunnel_stop_failure_d_ios_phone?x=1',
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
            'npm run validate-ddg-live-pixel tests/test_data/valid test_pixels.json m.netp.tunnel.stop.failure /t/m_netp_tunnel_stop_failure_d_ios_phone?ud5=1',
            (error, _, stderr) => {
                expect(stderr.length).to.equal(0);
                expect(error).to.equal(null);

                done();
            },
        );
    }).timeout(timeout);
});
