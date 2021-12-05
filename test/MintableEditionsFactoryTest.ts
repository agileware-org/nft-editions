const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

import "@nomiclabs/hardhat-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  MintableEditionsFactory,
  MintableEditions,
} from "../typechain";

describe("MintableEditionsFactory", function () {
  let artist: SignerWithAddress;
  let shareholder: SignerWithAddress;
  let factory: MintableEditionsFactory;
  
  beforeEach(async () => {
    const { MintableEditionsFactory } = await deployments.fixture(["Editions"]);
    const dynamicMintableAddress = (await deployments.get("MintableEditions")).address;
    factory = (await ethers.getContractAt("MintableEditionsFactory", MintableEditionsFactory.address)) as MintableEditionsFactory;
    [artist, shareholder] = await ethers.getSigners();
  });

  it("Should emit a CreatedEditions event upon create", async function () {
    expect(await factory.instances()).to.be.equal(0);
    const expectedAddress = await factory.get(0);
    await expect(factory.create(
      "Roberto Lo Giacco",
      "RLG",
      "**Me**, _myself_ and I. A gentle reminder to take care of our inner child, avoiding to take ourselves too seriously, no matter the circumstances: we are just _'a blade of grass'_. See [my website](http://www.agileware.org)",
      "https://ipfs.io/ipfs/bafybeib52yyp5jm2vwifd65mv3fdmno6dazwzyotdklpyq2sv6g2ajlgxu",
      "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
      "https://i.imgur.com/FjT55Ou.jpg",
      1000,
      250,
      [{holder: (await shareholder.getAddress()) as string, bps: 1500}]))
      
      .to.emit(factory, "CreatedEditions");
    
    expect(await factory.instances()).to.be.equal(1);
    expect(await factory.get(0)).to.be.equal(expectedAddress);
    
  });

  it("Should produce an initialized MintableEditions instance upon create", async function () {
    const receipt = await (await factory.create(
      "Roberto Lo Giacco",
      "RLG",
      "**Me**, _myself_ and I. A gentle reminder to take care of our inner child, avoiding to take ourselves too seriously, no matter the circumstances: we are just _'a blade of grass'_. See [my website](http://www.agileware.org)",
      "https://ipfs.io/ipfs/QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
      "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
      "",
      2500,
      150,
      [{holder: (await shareholder.getAddress()) as string, bps: 500}]
    )).wait();

    let contractAddress = "0x0";
    for (const event of receipt.events!) {
      if (event.event === "CreatedEditions") {
        contractAddress = event.args![4];
      }
    }
    expect(contractAddress).to.not.be.equal("0x0");
    const editions = (await ethers.getContractAt("MintableEditions", contractAddress)) as MintableEditions
    expect(await editions.name()).to.be.equal("Roberto Lo Giacco");
    expect(await editions.symbol()).to.be.equal("RLG");
    expect(await editions.description()).to.be.equal("**Me**, _myself_ and I. A gentle reminder to take care of our inner child, avoiding to take ourselves too seriously, no matter the circumstances: we are just _'a blade of grass'_. See [my website](http://www.agileware.org)");
    expect(await editions.contentUrl()).to.be.equal("https://ipfs.io/ipfs/QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d");
    expect(await editions.contentHash()).to.be.equal("0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc");
    expect(await editions.thumbnailUrl()).to.be.equal("");
    expect(await editions.size()).to.be.equal(2500);
    expect(await editions.royalties()).to.be.equal(150);
    expect(await editions.shares(artist.address)).to.be.equal(9500);
    expect(await editions.shares(shareholder.address)).to.be.equal(500);
    expect(await editions.mintable()).to.be.equal(2500);
    expect(await editions.price()).to.be.equal(0);
    expect(await editions.totalSupply()).to.be.equal(0);
  });
});