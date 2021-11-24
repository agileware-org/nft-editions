// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */

pragma solidity 0.8.6;

import {ClonesUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "./Edition.sol";

contract EditionFactory {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    // Counter for current contract id upgraded
    CountersUpgradeable.Counter private atContract;

    // Address for implementation of SingleEditionMintable to clone
    address public implementation;

    /**
     * Initializes factory with address of implementation logic
     * 
     * @param _implementation SingleEditionMintable logic implementation contract to clone
     */
    constructor(address _implementation) {
        implementation = _implementation;
    }

    /**
     * Creates a new edition contract as a factory with a deterministic address, returning the address of the newly created Edition contract.
     * Important: None of these fields can be changed after calling this operation, with the sole exception of the contentUrl field which must refer to a content having the same hash
     * 
     * @param _name Name of the edition contract
     * @param _symbol Symbol of the edition contract
     * @param _description Metadata: Description of the edition entry
     * @param _contentUrl Metadata: Image url (semi-required) of the edition entry
     * @param _contentHash Metadata: SHA-256 hash of the Image of the edition entry (if not image, can be 0x0)
     * @param _editionSize Total size of the edition (number of possible editions)
     * @param _salePrice sale price, set to 0 for disabling sales
     * @param _royaltyBPS royalties in BPS
     */
    function createEdition(
        string memory _name,
        string memory _symbol,
        string memory _description,
        string memory _contentUrl,
        bytes32 _contentHash,
        uint256 _editionSize,
        uint256 _salePrice,
        uint256 _royaltyBPS
    ) external returns (uint256) {
        uint256 newId = atContract.current();
        address newContract = ClonesUpgradeable.cloneDeterministic(implementation, bytes32(abi.encodePacked(newId)));
        
        Edition(newContract).initialize(msg.sender, _name, _symbol, _description, _contentUrl, _contentHash, _editionSize, _salePrice, _royaltyBPS);
        emit CreatedEdition(newId, msg.sender, _editionSize, newContract);
        // Returns the ID of the recently created minting contract
        // Also increments for the next contract creation call
        atContract.increment();
        return newId;
    }

    /**
     * Gets an edition given the created ID
     * 
     * @param editionId id of edition to get contract for
     * @return SingleEditionMintable Edition NFT contract
     */
    function getEditionAtId(uint256 editionId) external view returns (Edition) {
        return
            Edition(
                ClonesUpgradeable.predictDeterministicAddress(
                    implementation,
                    bytes32(abi.encodePacked(editionId)),
                    address(this)
                )
            );
    }

    /**
     * Emitted when a edition is created reserving the corresponding token IDs.
     * 
     * @param editionId the identifier of newly created edition
     */
    event CreatedEdition(
        uint256 indexed editionId,
        address indexed creator,
        uint256 editionSize,
        address editionContractAddress
    );
}
