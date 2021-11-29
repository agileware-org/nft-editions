// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */

pragma solidity 0.8.6;

import {ClonesUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

import "./Edition.sol";

contract EditionFactory {
    using Counters for Counters.Counter;

    // Counter for current contract id
    Counters.Counter internal counter;

    // Address for implementation of Edition contract to clone
    address private implementation;

    // Store for hash codes of editions contents: used to prevent re-issuing of the same content
    mapping(bytes32 => bool) private contents;

    /**
     * Initializes the factory with the address of the implementation contract template
     * 
     * @param _implementation Edition implementation contract to clone
     */
    constructor(address _implementation) {
        implementation = _implementation;
    }

    /**
     * Creates a new edition contract as a factory with a deterministic address, returning the address of the newly created Edition contract.
     * Important: None of these fields can be changed after calling this operation, with the sole exception of the contentUrl field which must refer to a content having the same hash.
     * Returns the id of the created editions contract.
     * 
     * @param _name Name of the editions contract
     * @param _symbol Symbol of the editions contract
     * @param _description Metadata: description of the editions entry
     * @param _contentUrl Metadata: content url of the editions entry
     * @param _contentHash Metadata: SHA-256 hash of the content of the editions entry
     * @param _size the number of tokens this editions contract consists of
     * @param _royalties perpetual royalties paid to the creator upon token selling
     * @param _shareholders addresses receiving shares (can be empty)
     * @param _shares shares in bps destined to the shareholders (one per each shareholder)
     */
    function create(
        string memory _name,
        string memory _symbol,
        string memory _description,
        string memory _contentUrl,
        bytes32 _contentHash,
        uint8 _contentType,
        uint64 _size,
        uint16 _royalties,
        address[] memory _shareholders,
        uint16[] memory _shares
    ) external returns (address) {
        require(!contents[_contentHash], "Edition: duplicated content!");
        contents[_contentHash] = true;
        uint256 id = counter.current();
        address instance = ClonesUpgradeable.cloneDeterministic(implementation, bytes32(abi.encodePacked(id)));
        Edition(instance).initialize(msg.sender, _name, _symbol, _description, _contentUrl, _contentHash, _contentType, _size, _royalties, _shareholders, _shares);
        emit CreatedEdition(id, msg.sender, _shareholders, _size, instance);
        counter.increment();
        return instance;
    }

    /**
     * Gets an editions contract given the unique identifier. Contract ids are zero-based.
     * 
     * @param index zero-based index of editions contract to retrieve
     * @return the editions contract
     */
    function get(uint256 index) external view returns (Edition) {
        return Edition(ClonesUpgradeable.predictDeterministicAddress(implementation, bytes32(abi.encodePacked(index)), address(this)));
    }

    /** 
     * @return the number of edition contracts created so far through this factory
     */
     function instances() external view returns (uint256) {
        return counter.current();
    }

    /**
     * Emitted when an edition is created reserving the corresponding token IDs.
     * 
     * @param index the identifier of the newly created editions contract
     * @param creator the editions' owner
     * @param size the number of tokens this editions contract consists of
     * @param contractAddress the address of the contract representing the editions
     */
    event CreatedEdition(uint256 indexed index, address indexed creator, address[] indexed shareholders, uint64 size, address contractAddress);
}
