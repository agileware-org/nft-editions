// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */
pragma solidity 0.8.6;

import {PaymentSplitterUpgradeable} from "@openzeppelin/contracts-upgradeable/finance/PaymentSplitterUpgradeable.sol";

import "./ISplitter.sol";

contract ShakeableSplitter is PaymentSplitterUpgradeable, ISplitter  {
    uint256 payees;

    function initialize(address[] memory _payees, uint256[] memory _shares) public override initializer {
        __PaymentSplitter_init(_payees, _shares);
        payees = _payees.length;
        uint256 totalShares = 0;
        for (uint i = 0; i < _payees.length; i++) {
            totalShares += _shares[i];
        }
        require(totalShares == 10_000, "Shares don't sum up to 100%");
        
    }

    function shake() public {
        for (uint i = 0; i < payees; i++) {
            super.release(payable(super.payee(i)));
        }
    }
}