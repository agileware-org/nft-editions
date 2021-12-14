const {ethers} = require("hardhat");

import "@nomiclabs/hardhat-ethers";

describe("Deployments", function () {

  it("Should deploy MintableEditionsFactory", async function () {
    const EditionsMetadataHelper = await ethers.getContractFactory("EditionsMetadataHelper");
    const metadata = await EditionsMetadataHelper.deploy();

    const MintableEditions = await ethers.getContractFactory("MintableEditions");
    const editionsTemplate = await MintableEditions.deploy(metadata.address);

    const MintableEditionsFactory = await ethers.getContractFactory("MintableEditionsFactory");
    await MintableEditionsFactory.deploy(editionsTemplate.address);
  });

  it("Should deploy SplitterFactory contracts", async function () {
    const PushSplitter = await ethers.getContractFactory("PushSplitter");
    const pushSplitter = await PushSplitter.deploy();

    const ShakeableSplitter = await ethers.getContractFactory("ShakeableSplitter");
    const shakeableSplitter = await ShakeableSplitter.deploy();

    const SplitterFactory = await ethers.getContractFactory("SplitterFactory");
    const factory = await SplitterFactory.deploy();
    await SplitterFactory.deploy();
  
    await factory.addSplitterType(ethers.utils.keccak256(Buffer.from("push")), pushSplitter.address);
    await factory.addSplitterType(ethers.utils.keccak256(Buffer.from("shakeable")), shakeableSplitter.address);
  });
});
