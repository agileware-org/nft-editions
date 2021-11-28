// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */

pragma solidity 0.8.6;

import {ClonesUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

import "./ISplitter.sol";

contract SplitterFactory  {
    using Counters for Counters.Counter;

    // Counter for current contract id
    Counters.Counter private counter;

    // Address for implementation of Splitter contract to clone
    address public implementation;

    /**
     * Initializes the factory with the address of the implementation contract template
     * 
     * @param _implementation Edition implementation contract to clone
     */
    constructor(address _implementation) {
        implementation = _implementation;
    }

    /**
     * Creates a new splitter contract as a factory with a deterministic address, returning the address of the newly created splitter contract.
     * Returns the id of the created splitter contract.
     * 
     * @param _payees Name of the edition contract
     * @param _pbsShares Symbol of the edition contract
     */
    function createSplitter(address[] memory _payees, uint256[] memory _pbsShares) external returns (address) {
        uint16 totalShares = 0;
        for (uint i = 0; i < _payees.length; i++) {
            totalShares += uint16(_pbsShares[i]);
        }
        require(totalShares <= 10_000, "Exceeding fees!");
        uint256 id = counter.current();
        address payable instance = payable(ClonesUpgradeable.cloneDeterministic(implementation, bytes32(abi.encodePacked(id))));
        ISplitter(instance).initialize(_payees, _pbsShares);
        emit CreatedSplitter(id, msg.sender, _payees, instance);
        counter.increment();
        return instance;
    }

    /**
     * Gets a splitter given the unique identifier
     * 
     * @param splitterId id of splitter to get contract for
     * @return the Splitterayment contract
     */
    function getSplitterAtId(uint256 splitterId) external view returns (ISplitter) {
        return ISplitter(payable(ClonesUpgradeable.predictDeterministicAddress(implementation, bytes32(abi.encodePacked(splitterId)), address(this))));
    }

    /**
     * Emitted when a splitter is created.
     * 
     * @param splitterId the identifier of newly created edition
     * @param creator the edition's owner
     * @param payees the number of NFTs this edition consists of
     * @param contractAddress the address of the contract represneting the edition
     */
    event CreatedSplitter(uint256 indexed splitterId, address indexed creator, address[] payees, address contractAddress);
}
