// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 * Made with 🧡 by Kreation.tech
 */
pragma solidity ^0.8.6;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

import "./ISplitter.sol";
import "./PushSplitter.sol";
import "./ShakeableSplitter.sol";

contract SplitterFactory  {
    using Counters for Counters.Counter;

    // Counter for current contract id
    Counters.Counter internal counter;

    // Address for implementation of ISplitter contract to clone
    address immutable private implementation;

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
     * @param _payees list of addresses receiving a share 
     * @param _shares list shares in bps, one per each address
     */
    function create(address[] memory _payees, uint256[] memory _shares) external returns (address payable) {
        uint256 id = counter.current();
        address payable instance = payable(Clones.cloneDeterministic(implementation, bytes32(abi.encodePacked(id))));
        ISplitter(instance).initialize(_payees, _shares);
        emit CreatedSplitter(id, msg.sender, _payees, instance);
        counter.increment();
        return instance;
    }

    /**
     * Gets a splitter given the unique identifier
     * 
     * @param index id of splitter to get contract for
     * @return the Splitter payment contract
     */
    function get(uint256 index) external view returns (ISplitter) {
        return ISplitter(payable(Clones.predictDeterministicAddress(implementation, bytes32(abi.encodePacked(index)), address(this))));
    }

    /**
     * @return the number of splitter instances released so far
     */
    function instances() external view returns (uint256) {
        return counter.current();
    }

    /**
     * Emitted when a splitter is created.
     * 
     * @param index the identifier of newly created edition
     * @param creator the edition's owner
     * @param payees the number of NFTs this edition consists of
     * @param contractAddress the address of the contract represneting the edition
     */
    event CreatedSplitter(uint256 indexed index, address indexed creator, address[] payees, address contractAddress);
}
