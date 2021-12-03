import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, run, getNamedAccounts} = hre;
  const {deploy, get} = deployments;
  const {deployer} = await getNamedAccounts();

  const editions = await get('MintableEditions');
  const deployed = await deploy('MintableEditionsFactory', {
    from: deployer,
    args: [editions.address],
    log: true,
  });
};
export default func;
func.dependencies = ['MintableEditions'];