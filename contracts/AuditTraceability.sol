// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AuditTraceability {
    struct Report {
        uint256 id;
        string date;
        string reportHash;
        address auditor;
    }

    mapping(uint256 => Report) public reports;
    uint256 public reportCount;

    event ReportCertified(uint256 id, string date, string reportHash, address auditor);

    function certifyReport(string memory _date, string memory _reportHash) public {
        reportCount++;
        reports[reportCount] = Report(reportCount, _date, _reportHash, msg.sender);
        emit ReportCertified(reportCount, _date, _reportHash, msg.sender);
    }

    function getReport(uint256 _id) public view returns (uint256, string memory, string memory, address) {
        Report memory r = reports[_id];
        return (r.id, r.date, r.reportHash, r.auditor);
    }
}
