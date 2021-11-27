// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */

pragma solidity 0.8.6;


import {MetadataHelper} from "./MetadataHelper.sol";

/**
 * Shared NFT logic for rendering metadata associated with editions
 */
contract EditionMetadata is MetadataHelper {

    /**
     * Generates edition metadata from storage information as base64-json blob
     * Combines the media data and metadata
     * 
     * @param name Name of NFT in metadata
     * @param description Description of NFT in metadata
     * @param contentUrl URL of image to render for edition
     * @param tokenOfEdition Token ID for specific token
     * @param editionSize Size of entire edition to show
     */
    function createTokenURI(string memory name, string memory description, string memory contentUrl, uint256 tokenOfEdition, uint256 editionSize) external pure returns (string memory) {
        string memory _tokenMediaData = tokenMediaData(contentUrl, tokenOfEdition);
        bytes memory json = createMetadata(name, description, _tokenMediaData, tokenOfEdition, editionSize);
        return encodeMetadata(json);
    }

    /** 
     * Function to create the metadata json string for the nft edition
     * 
     * @param name Name of NFT in metadata
     * @param description Description of NFT in metadata
     * @param mediaData Data for media to include in json object
     * @param tokenOfEdition Token ID for specific token
     * @param editionSize Size of entire edition to show
    */
    function createMetadata(string memory name, string memory description, string memory mediaData, uint256 tokenOfEdition, uint256 editionSize) public pure returns (bytes memory) {
        bytes memory editionSizeText;
        if (editionSize > 0) {
            editionSizeText = abi.encodePacked("/", numberToString(editionSize));
        }
        return abi.encodePacked('{"name": "', name, " ", numberToString(tokenOfEdition), editionSizeText, '", "',
                'description": "', description, '", "',
                mediaData,
                'properties": {"number": ', numberToString(tokenOfEdition), ', "name": "', name, '"}}'
            );
    }

    /** 
     * Generates edition metadata from storage information as base64-json blob
     * Combines the media data and metadata
     * 
     * @param contentUrl URL of image to render for edition
     * @param tokenOfEdition token identifier
     */
    function tokenMediaData(string memory contentUrl, uint256 tokenOfEdition) public pure returns (string memory) {
        bool hasContent = bytes(contentUrl).length > 0;
        if (hasContent) {
            return string(abi.encodePacked('content": "', contentUrl, "?id=", numberToString(tokenOfEdition),'", "'));
        }
        return "";
    }
}
