
require('./initTestConfig');

var tourneyCfg = require('../server/tourneyConfigReader').loadConfig();

describe('tourneyConfig', function () {

    describe('commands', function () {

        it('properly concatenates string arrays', function () {
            tourneyCfg.commands.concat.should.eql("command to run");
        });
    });
});
