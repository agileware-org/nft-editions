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
    event PaymentFailed(address to);
    uint256 _payees;

    function initialize(address[] memory payees, uint256[] memory shares) public override initializer {
        __PaymentSplitter_init(payees, shares);
        _payees = payees.length;
        uint256 totalShares = 0;
        for (uint i = 0; i < payees.length; i++) {
            totalShares += shares[i];
        }
        require(totalShares == 10_000, "Shares don't sum up to 100%");
        
    }

    function shake() public {
        for (uint i = 0; i < _payees; i++) {
            try this.release(payable(super.payee(i))) {
                // do nothing
            } catch {
                emit PaymentFailed(super.payee(i));
            }
        }
    }
}