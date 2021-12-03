// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */

pragma solidity 0.8.6;

import {ClonesUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "./ISplitter.sol";
import "./PushSplitter.sol";
import "./ShakeableSplitter.sol";

contract SplitterFactory  {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    // Counter for current contract id
    CountersUpgradeable.Counter internal _counter;

    // Address for implementation of ISplitter contract to clone
    address immutable private _implementation;

    /**
     * Initializes the factory with the address of the implementation contract template
     * 
     * @param implementation Edition implementation contract to clone
     */
    constructor(address implementation) {
        _implementation = implementation;
    }

    /**
     * Creates a new splitter contract as a factory with a deterministic address, returning the address of the newly created splitter contract.
     * Returns the id of the created splitter contract.
     * 
     * @param payees list of addresses receiving a share 
     * @param shares list shares in bps, one per each address
     */
    function create(address[] memory payees, uint256[] memory shares) external returns (address payable) {
        uint256 id = _counter.current();
        address payable instance = payable(ClonesUpgradeable.cloneDeterministic(_implementation, bytes32(abi.encodePacked(id))));
        ISplitter(instance).initialize(payees,shares);
        emit CreatedSplitter(id, msg.sender, payees, instance);
        _counter.increment();
        return instance;
    }

    /**
     * Gets a splitter given the unique identifier
     * 
     * @param index id of splitter to get contract for
     * @return the Splitter payment contract
     */
    function get(uint256 index) external view returns (ISplitter) {
        return ISplitter(payable(ClonesUpgradeable.predictDeterministicAddress(_implementation, bytes32(abi.encodePacked(index)), address(this))));
    }

    /**
     * @return the number of splitter instances released so far
     */
    function instances() external view returns (uint256) {
        return _counter.current();
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
