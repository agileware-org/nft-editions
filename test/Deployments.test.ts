import "@nomiclabs/hardhat-ethers";

import { ethers } from "hardhat";

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
    await SplitterFactory.deploy(pushSplitter.address);
    await SplitterFactory.deploy(shakeableSplitter.address);
  });
});
