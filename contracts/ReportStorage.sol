// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ReportStorage {
    struct Report {
        string reportId;
        string date;
        string hashValue;
    }

    Report[] public reports;

    event ReportStored(
        string reportId,
        string date,
        string hashValue,
        uint256 index
    );

    function storeReport(
        string memory _reportId,
        string memory _date,
        string memory _hashValue
    ) public {
        reports.push(Report(_reportId, _date, _hashValue));

        emit ReportStored(_reportId, _date, _hashValue, reports.length - 1);
    }

    function getReport(uint256 index)
        public
        view
        returns (string memory, string memory, string memory)
    {
        Report memory r = reports[index];
        return (r.reportId, r.date, r.hashValue);
    }

    function getReportsCount() public view returns (uint256) {
        return reports.length;
    }
}
