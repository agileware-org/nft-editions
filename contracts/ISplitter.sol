// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 * Made with 🧡 in Italy by 𝗔𝗴𝗶𝗹𝗲𝗪𝗮𝗿𝗲 (www.agileware.org)
 */
pragma solidity 0.8.10;

interface ISplitter {
    
    function initialize(address[] memory _payees, uint256[] memory _shares) external;

}