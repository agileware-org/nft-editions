/* eslint-disable camelcase */
/* eslint-disable node/no-missing-import */
/* eslint-disable node/no-unpublished-require */
/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction, DeployResult } from "hardhat-deploy/types";
import { SplitterFactory__factory } from "../src/types";
import "hardhat-deploy-ethers";
import { writeFileSync } from "fs";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = require("hardhat");
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const factory = await deploy("SplitterFactory", {
    from: deployer,
    log: true
  }) as DeployResult;

  if (await getChainId() < 10) {
    const [artist] = await hre.ethers.getSigners();
    const contract = SplitterFactory__factory.connect(factory.address, artist);
    const splitters:{[name: string]: string} = {};
    // adds push splitter
    const push = await get("PushSplitter");
    splitters.push = await hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("push"));
    await contract.connect(artist).addSplitterType(splitters.push, push.address);
    // adds shakeable splitter
    const shakeable = await get("ShakeableSplitter");
    splitters.shakeable = await hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("shakeable"));
    await contract.connect(artist).addSplitterType(splitters.shakeable, shakeable.address);

    writeFileSync("./src/splitters.json", JSON.stringify(splitters, null, 2), { encoding: "utf-8" });
  }
};
export default func;
func.dependencies = ["PushSplitter"];
func.dependencies = ["ShakeableSplitter"];
func.tags = ["splitters"];
