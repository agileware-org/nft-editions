// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */

pragma solidity 0.8.6;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {IERC2981Upgradeable, IERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {AddressUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import {EditionMetadata} from "./EditionMetadata.sol";
import {IEdition} from "./IEdition.sol";

/**
 * This contract allows dynamic NFT minting.
 * 
 * Operations allow for selling publicly, partial or total giveaways, direct giveaways and rewardings.
 */
contract Edition is ERC721Upgradeable, IERC2981Upgradeable, IEdition, OwnableUpgradeable {
    
    using CountersUpgradeable for CountersUpgradeable.Counter;
    event PriceChanged(uint256 amount);
    event EditionSold(uint256 price, address owner);

    // metadata
    string private description;

    // The token content URL
    string private contentUrl;
    // Hash for the associated content
    bytes32 private contentHash;
    // The media type of the content
    bytes32 private contentType;

    // Total size of edition that can be minted
    uint256 public editionSize;
    
    // Current token id minted
    CountersUpgradeable.Counter private atEditionId;
    
    // Royalty amount in bps
    uint256 royaltyBPS;
    
    // Addresses allowed to mint edition
    mapping(address => uint32) allowedMinters;

    // Price for sale
    uint256 public salePrice;

    // NFT rendering logic
    EditionMetadata private immutable metadata;

    // Global constructor for factory
    constructor(EditionMetadata _metadata) {
        metadata = _metadata;
    }

    /**
     * Function to create a new edition. Can only be called by the allowed creator
     * Sets the only allowed minter to the address that creates/owns the edition: this can be re-assigned or updated later
     * 
     * @param _owner User that owns and can mint the edition, gets royalty and sales payouts and can update the base url if needed.
     * @param _name Name of edition, used in the title as "$NAME NUMBER/TOTAL"
     * @param _symbol Symbol of the new token contract
     * @param _description Description of edition, used in the description field of the NFT
     * @param _contentUrl Content URL of the edition.
     * @param _contentHash SHA256 of the given content in bytes32 format (0xHASH).
     * @param _editionSize Number of editions that can be minted in total. If 0, unlimited editions can be minted.
     * @param _royaltyBPS Royalties paid to the creator upon token selling
     */
    function initialize(
        address _owner,
        string memory _name,
        string memory _symbol,
        string memory _description,
        string memory _contentUrl,
        bytes32 _contentHash,
        uint256 _editionSize,
        uint256 _royaltyBPS
    ) public initializer {
        __ERC721_init(_name, _symbol);
        __Ownable_init();
        // Set ownership to original sender of contract call
        transferOwnership(_owner);
        description = _description;
        contentUrl = _contentUrl;
        contentHash = _contentHash;
        editionSize = _editionSize;
        royaltyBPS = _royaltyBPS;
        // Set edition id start to be 1 not 0
        atEditionId.increment();
    }


    /**
     * Returns the number of tokens minted within this edition 
     */
     function totalSupply() public view returns (uint256) {
        return atEditionId.current() - 1;
    }
    
    /**
        Simple eth-based sales function
        More complex sales functions can be implemented through ISingleEditionMintable interface
     */

    /**
     * Basic ETH-based sales operation, performed at the given set price.
     * This operation is open to everyone as soon as the salePrice is set.
     */
    function purchase() external payable returns (uint256) {
        require(salePrice > 0, "Not for sale");
        require(msg.value == salePrice, "Wrong price");
        address[] memory toMint = new address[](1);
        toMint[0] = msg.sender;
        emit EditionSold(salePrice, msg.sender);
        return _mintEditions(toMint);
    }

    /**
     * This operation sets the sale price, thus allowing anyone to acquire a token from this edition at the sale price via the purchase operation.
     * Setting the sale price to 0 prevents purchase of the tokens which is then allowed only to permitted addresses.
     * 
     * @param _wei if sale price is 0, no sale is allowed, otherwise the provided amount of WEI is needed to start the sale.
     */
    function setSalePrice(uint256 _wei) external onlyOwner {
        salePrice = _wei;
        emit PriceChanged(salePrice);
    }

    /**
     * This operation withdraws ETH from the contract to the contract owner.
     */
    function withdraw() external onlyOwner {
        AddressUpgradeable.sendValue(payable(owner()), address(this).balance);
    }

    /**
     * Internal: checks if the msg.sender is allowed to mint the given edition id.
     */
    function _isAllowedToMint() internal view returns (bool) {
        return (owner() == msg.sender) || _isPublicAllowed() || (allowedMinters[msg.sender] > 0);
    }
    
    /**
     * Internal: checks if the ZeroAddress is allowed to mint the given edition id.
     */
    function _isPublicAllowed() internal view returns (bool) {
        return (allowedMinters[address(0x0)] > 0);
    }

    /**
     * This mints one edition for an allowed minter on the edition instance.
     * 
     */
    function mintEdition() external override returns (uint256) {
        require(_isAllowedToMint(), "Needs to be an allowed minter");
        address[] memory toMint = new address[](1);
        toMint[0] = msg.sender;
        if (owner() != msg.sender && !_isPublicAllowed()) {
            allowedMinters[msg.sender] = --allowedMinters[msg.sender];
        }
        return _mintEditions(toMint);
    }

    /**
     * This mints multiple editions to the given list of addresses and it is intended for partial giveaways.
     * Only the contract owner or an approved address can use this operation.
     * 
     * @param recipients list of addresses to send the newly minted editions to
     */
    function mintEditions(address[] memory recipients) external onlyOwner override returns (uint256) {
        return _mintEditions(recipients);
    }

    /**
        Simple override for owner interface.
     */
    function owner() public view override(OwnableUpgradeable, IEdition) returns (address) {
        return super.owner();
    }

    /**
     * Sets the approved minting status of the given address.
     * This requires that msg.sender is the owner of the given edition id.
     * If the ZeroAddress (address(0x0)) is set as a minter, anyone will be allowed to mint.
     * This setup is similar to setApprovalForAll in the ERC721 spec.
     * 
     * @param minter address to set approved minting status for
     * @param allowed uint32 how many tokens this address is allowed to mint
     */
    function setApprovedMinter(address minter, uint32 allowed) public onlyOwner {
        allowedMinters[minter] = allowed;
    }

    /**
     * Allows for updates of edition urls by the owner of the edition.
     * Only URLs can be updated (data-uris are supported), hashes cannot be updated.
     */
    function updateEditionURL(string memory _contentUrl) public onlyOwner {
        contentUrl = _contentUrl;
    }

    /** 
     * Returns the number of editions allowed to mint (max_uint256 when open edition)
     */
    function numberCanMint() public view override returns (uint256) {
        // Return max int if open edition
        if (editionSize == 0) {
            return type(uint256).max;
        }
        // atEditionId is one-indexed hence the need to remove one here
        return editionSize + 1 - atEditionId.current();
    }

    /**
     * User burn function for token id.
     * 
     *  @param tokenId Token ID to burn
     */
    function burn(uint256 tokenId) public {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not approved");
        _burn(tokenId);
    }

    /**
     * Private function to mint als without any access checks.
     * Called by the public edition minting functions.
     */
    function _mintEditions(address[] memory recipients) internal returns (uint256) {
        uint256 startAt = atEditionId.current();
        uint256 endAt = startAt + recipients.length - 1;
        require(editionSize == 0 || endAt <= editionSize, "Sold out");
        while (atEditionId.current() <= endAt) {
            _mint(
                recipients[atEditionId.current() - startAt],
                atEditionId.current()
            );
            atEditionId.increment();
        }
        return atEditionId.current();
    }

    /**
     * Get URI and hash for edition NFT
     * @return contentUrl, contentHash
     */
    function getURI() public view returns (string memory, bytes32) {
        return (contentUrl, contentHash);
    }

    /**
     * Get URI for given token id
     * 
     * @param tokenId token id to get uri for
     * @return base64-encoded json metadata object
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "No token");

        return metadata.createMetadataEdition(name(), description, contentUrl, tokenId, editionSize);
    }
    
     /**
      * Gets royalty information for token
      * @param _salePrice the sale price for this token
      */
    function royaltyInfo(uint256, uint256 _salePrice) external view override returns (address receiver, uint256 royaltyAmount) {
        if (owner() == address(0x0)) {
            return (owner(), 0);
        }
        return (owner(), (_salePrice * royaltyBPS) / 10_000);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, IERC165Upgradeable) returns (bool) {
        return 
            type(IERC2981Upgradeable).interfaceId == interfaceId ||
            ERC721Upgradeable.supportsInterface(interfaceId);
    }
}
