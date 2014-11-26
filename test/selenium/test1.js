var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();

describe('test1', function () {
  it('test should run 1', function (done) {
    var browser = this.browser;
    browser.get('http://google.com')
    .title('q')
    .should
    .become('Alex is cool thanks')
    .then(done, done);
  });
});
