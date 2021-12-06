import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, run, getNamedAccounts} = hre;
  const {deploy, get} = deployments;
  const {deployer} = await getNamedAccounts();

  const metadataHelper = await get('EditionMetadata');
  const deployed = await deploy('MintableEditions', {
    from: deployer,
    log: true,
    args: [metadataHelper.address],
  });
};
export default func;
func.dependencies = ['EditionMetadata'];