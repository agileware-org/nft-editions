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
});
