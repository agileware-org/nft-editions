    // SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */

pragma solidity 0.8.6;

import {ClonesUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "./IRoyalties.sol";

contract RoyaltiesFactory is OwnableUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    
    // Counter for last royalties contract id released
    CountersUpgradeable.Counter private atContract;
    
    // Counter for last royalties implementation contract added
    CountersUpgradeable.Counter private atImplementation;
    
    // Addresses of 
    mapping(uint256 => address) implementations;
    
    constructor() {
        __Ownable_init();
        transferOwnership(msg.sender);
    }

    function addImplementation(address _implementation) public onlyOwner returns(uint256) {
        require(Address.isContract(_implementation), "Address not a contract");
        uint256 newId = atImplementation.current();
        implementations[newId] = _implementation;
        atImplementation.increment();
        return newId;
    }
    
    function createRoyalties(uint256 _typeId, address _recipient, uint32 _bps, bytes32[] memory _data) public returns (uint256) {
        uint256 newId = atContract.current();
        address newContract = ClonesUpgradeable.cloneDeterministic(implementations[_typeId], bytes32(abi.encodePacked(newId)));
        
        IRoyalties(newContract).initialize(_recipient, _bps, _data);
        emit CreatedRoyalties(newId, msg.sender, newContract);
        atContract.increment();
        return newId;
    }
    
    /**
     * Emitted when a edition is created reserving the corresponding token IDs.
     * 
     * @param royaltiesId the identifier of newly created royallties
     * @param creator the address creating the royalties contract
     * @param contractAddress the address of the newly created royalties contract
     */
    event CreatedRoyalties(
        uint256 indexed royaltiesId,
        address indexed creator,
        address contractAddress
    );

}