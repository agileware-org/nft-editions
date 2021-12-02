// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */
pragma solidity 0.8.6;

//import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import "./ISplitter.sol";

contract PushSplitter is Initializable, ISplitter {
    address[] internal _payees;
    mapping(address => uint16) internal _shares;
    
    function initialize(address[] memory payees, uint256[] memory shares) public override initializer {
        require(payees.length == shares.length, "Splitter: inputs length mismatch");
        require(payees.length > 0, "Splitter: no payees");
        uint256 totalShares = 0;
        for (uint i = 0; i < payees.length; i++) {
            _addPayee(payees[i], shares[i]);
            totalShares += shares[i];
        }
        require(totalShares == 10_000, "Shares don't sum up to 10000 pbs");
    }

    /**
     * Adds a new payee to the contract.
     * 
     * @param account the address of the payee to add.
     * @param shares the number of shares owned by the payee.
     */
    function _addPayee(address account, uint256 shares) internal {
        require(account != address(0x0), "Splitter: account is 0x0 address");
        require(shares > 0 && shares < 10_000, "Splitter: invalid shares");
        require(_shares[account] == 0, "Splitter: account duplicated");

        _payees.push(account);
        _shares[account] = uint16(shares);
    }

    receive() external payable virtual {
        uint256 value = address(this).balance;
        for (uint i = 0; i < _payees.length; i++) {
            uint256 amount = value * _shares[_payees[i]] / 10_000;
            AddressUpgradeable.sendValue(payable(_payees[i]), amount);
        }
    }
}