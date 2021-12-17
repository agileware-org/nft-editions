/* eslint-disable node/no-missing-import */
/* eslint-disable camelcase */
import "@nomiclabs/hardhat-ethers";

import { ethers } from "hardhat";
import { SplitterFactory, SplitterFactory__factory } from "../src/types";

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

    const [deployer] = await ethers.getSigners();
    const instance = SplitterFactory__factory.connect(factory.address, deployer) as SplitterFactory;
    const push = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("push"));
    const shake = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("shake"));
    instance.addSplitterType(push, pushSplitter.address);
    instance.addSplitterType(shake, shakeableSplitter.address);
  });
});
