// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 * Made with 🧡 by Kreation.tech
 */
pragma solidity ^0.8.6;

import {PaymentSplitterUpgradeable} from "@openzeppelin/contracts-upgradeable/finance/PaymentSplitterUpgradeable.sol";

import "./ISplitter.sol";

contract ShakeableSplitter is PaymentSplitterUpgradeable, ISplitter  {
    event PaymentFailed(address to);
    uint256 _payees;

    constructor() initializer { }

    function initialize(Shares[] memory shares) public override initializer {
        address[] memory addresses = new address[](shares.length);
        uint256[] memory bps = new uint256[](shares.length);
        uint256 totalShares = 0;
        _payees = shares.length;
        for (uint i = 0; i < shares.length; i++) {
            addresses[i] = shares[i].payee;
            bps[i] = shares[i].bps;
            totalShares += shares[i].bps;
        }
        require(totalShares == 10_000, "Shares don't sum up to 100%");
        __PaymentSplitter_init(addresses, bps);
        
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