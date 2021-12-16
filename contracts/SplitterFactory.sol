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
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import "./ISplitter.sol";
import "./PushSplitter.sol";
import "./ShakeableSplitter.sol";

contract SplitterFactory is Ownable {
    using Counters for Counters.Counter;

    // Counter for current contract id
    Counters.Counter internal _counter;

    // Address for implementation of ISplitter contract to clone
    mapping(bytes32 => address) private _implementations;

    constructor() {}

    /**
     * Initializes the factory with the address of the implementation contract template
     * 
     * @param splitterType type of splitter
     * @param implementation Edition implementation contract to clone
     */
    function addSplitterType(bytes32 splitterType, address implementation) external onlyOwner {
        require(_implementations[splitterType] == address(0x0), "Splitter type already defined");
        _implementations[splitterType] = implementation;
    }

    /**
     * Creates a new splitter contract as a factory with a deterministic address, returning the address of the newly created splitter contract.
     * Returns the id of the created splitter contract.
     * 
     * @param splitterType type of splitter
     * @param shares list of tuples representing the payees and their shares in bps
     */
    function create(bytes32 splitterType, ISplitter.Shares[] memory shares) external returns (address payable) {
        uint256 id = _counter.current();
        address payable instance = payable(Clones.cloneDeterministic(_implementations[splitterType], bytes32(abi.encodePacked(id))));
        ISplitter(instance).initialize(shares);
        emit CreatedSplitter(id, msg.sender, instance, splitterType, shares);
        _counter.increment();
        return instance;
    }

    /**
     * Gets a splitter given the unique identifier
     * 
     * @param splitterType type of splitter
     * @param index id of splitter to get contract for
     * @return the Splitter payment contract
     */
    function get(bytes32 splitterType, uint256 index) external view returns (ISplitter) {
        return ISplitter(payable(Clones.predictDeterministicAddress(_implementations[splitterType], bytes32(abi.encodePacked(index)), address(this))));
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
     * @param shares the shares splitting rules 
     * @param splitterType the type of splitter
     * @param contractAddress the address of the splitting contract
     */
    event CreatedSplitter(uint256 indexed index, address indexed creator, address contractAddress, bytes32 indexed splitterType, ISplitter.Shares[] shares);
}
