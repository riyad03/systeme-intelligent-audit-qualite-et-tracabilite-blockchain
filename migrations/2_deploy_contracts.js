const AuditTraceability = artifacts.require("AuditTraceability");

module.exports = function (deployer) {
    deployer.deploy(AuditTraceability);
};
