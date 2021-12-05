const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

import "@nomiclabs/hardhat-ethers";

describe("Deployments", function () {

  it("Should deploy MintableEditionsFactory", async function () {
    const EditionMetadata = await ethers.getContractFactory("EditionMetadata");
    const metadata = await EditionMetadata.deploy();

    const MintableEditions = await ethers.getContractFactory("MintableEditions");
    const editionsTemplate = await MintableEditions.deploy(metadata.address);

    const MintableEditionsFactory = await ethers.getContractFactory("MintableEditionsFactory");
    const factory = await MintableEditionsFactory.deploy(editionsTemplate.address);
  });

  it("Should deploy SplitterFactory contracts", async function () {
    const PushSplitter = await ethers.getContractFactory("PushSplitter");
    const pushSplitter = await PushSplitter.deploy();

    const ShakeableSplitter = await ethers.getContractFactory("ShakeableSplitter");
    const shakeableSplitter = await ShakeableSplitter.deploy();

    const SplitterFactory = await ethers.getContractFactory("SplitterFactory");
    const pushSplitterFactory = await SplitterFactory.deploy(pushSplitter.address);
    const shakeableSplitterFactory = await SplitterFactory.deploy(shakeableSplitter.address);
  });
});