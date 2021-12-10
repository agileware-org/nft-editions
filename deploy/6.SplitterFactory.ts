import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy, get} = deployments;
  const {deployer} = await getNamedAccounts();

  const push = await get('PushSplitter');
  await deploy('SplitterFactory', {
    from: deployer,
    log: true,
    args: [push.address],
  });

  const shakeable = await get('ShakeableSplitter');
  await deploy('SplitterFactory', {
    from: deployer,
    log: true,
    args: [shakeable.address],
  });
};
export default func;
func.dependencies = ['PushSplitter'];
func.dependencies = ['ShakeableSplitter'];
func.tags = ['splitters'];