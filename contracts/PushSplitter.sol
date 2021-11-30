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
    address[] internal payees;
    mapping(address => uint16) internal shares;
    
    function initialize(address[] memory _payees, uint256[] memory _shares) public override initializer {
        require(_payees.length == _shares.length, "Splitter: inputs length mismatch");
        require(_payees.length > 0, "Splitter: no payees");
        uint256 totalShares = 0;
        for (uint i = 0; i < _payees.length; i++) {
            _addPayee(_payees[i], _shares[i]);
            totalShares += _shares[i];
        }
        require(totalShares == 10_000, "Shares don't sum up to 10000 pbs");
    }

    /**
     * Adds a new payee to the contract.
     * 
     * @param _account the address of the payee to add.
     * @param _shares the number of shares owned by the payee.
     */
    function _addPayee(address _account, uint256 _shares) internal {
        require(_account != address(0x0), "Splitter: account is 0x0 address");
        require(_shares > 0 && _shares < 10_000, "Splitter: invalid shares");
        require(shares[_account] == 0, "Splitter: account duplicated");

        payees.push(_account);
        shares[_account] = uint16(_shares);
    }

    receive() external payable virtual {
        uint256 value = address(this).balance;
        for (uint i = 0; i < payees.length; i++) {
            uint256 amount = value * shares[payees[i]] / 10_000;
            AddressUpgradeable.sendValue(payable(payees[i]), amount);
        }
    }
}