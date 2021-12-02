const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MintableEditionsFactory", function () {
  it("Should return the a new MintableEditions upon create", async function () {
    const EditionMetadata = await ethers.getContractFactory("EditionMetadata");
    const meta = await EditionMetadata.deploy();
    await meta.deployed();
    const MintableEditions = await ethers.getContractFactory("MintableEditions");
    const editions = await MintableEditions.deploy(meta.address);
    await editions.deployed();
    const Factory = await ethers.getContractFactory("MintableEditionsFactory");
    const factory = await Factory.deploy(editions.address);
    await factory.deployed();

    expect(await factory.create()).to.equal("Hello, world!");

    const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});