require('./initTestConfig');

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();

describe('test1', function () {
  it('test should run 1', function () {
    var browser = this.browser;
    return browser.get('http://localhost:3000')
    .title('q')
    .should
    .become('The Golf Pool');
  });
});
