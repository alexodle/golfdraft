var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();

describe('test1', function () {
  it('test should run 1', function (done) {
    var browser = this.browser;
    browser.get('http://localhost:3000')
    .title('q')
    .should
    .become('The Golf Pool')
    .then(function () {
      done();
    }, done);
  });
});
