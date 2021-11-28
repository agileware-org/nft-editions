// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */
pragma solidity 0.8.6;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

import "./ISplitter.sol";

contract PushSplitter is Initializable, ISplitter {
    
    address[] private payees;
    mapping(address => uint16) private shares;
    
    function initialize(address[] memory _payees, uint256[] memory _shares) public override initializer {
        require(_payees.length == _shares.length, "PushSplitter: payees and shares length mismatch");
        require(_payees.length > 0, "PushSplitter: no payees");
        uint256 totalShares = 0;
        for (uint i = 0; i < _payees.length; i++) {
            shares[_payees[i]] = uint16(_shares[i]);
            totalShares += _shares[i];
        }
        require(totalShares == 10_000, "Shares don't sum up to 100%");
        payees = _payees;
    }

    receive() external payable virtual {
        uint256 value = address(this).balance;
        for (uint i = 0; i < payees.length; i++) {
            uint256 amount = value * shares[payees[i]] / 10_000;
            Address.sendValue(payable(payees[i]), amount);
        }
    }

}