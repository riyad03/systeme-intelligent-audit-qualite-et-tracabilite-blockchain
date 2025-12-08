const ReportStorage = artifacts.require("ReportStorage");

module.exports = function (deployer) {
  deployer.deploy(ReportStorage);
};
