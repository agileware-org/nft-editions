import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, run, getNamedAccounts} = hre;
  const {deploy, get} = deployments;
  const {deployer} = await getNamedAccounts();

  const deployed = await deploy('EditionsMetadataHelper', {
    from: deployer,
    log: true,
  });
};
export default func;