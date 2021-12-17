/* eslint-disable node/no-missing-import */
/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  const metadataHelper = await get("EditionsMetadataHelper");
  await deploy("MintableEditions", {
    from: deployer,
    log: true,
    args: [metadataHelper.address]
  });
};
export default func;
func.dependencies = ["EditionsMetadataHelper"];
func.tags = ["editions"];
