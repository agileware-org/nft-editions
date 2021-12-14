import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction, DeployResult} from 'hardhat-deploy/types';
import {SplitterFactory__factory} from '../src/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts, ethers} = hre;
  const {deploy, get} = deployments;
  const {deployer} = await getNamedAccounts();
  const [signer] = await ethers.getSigners();

  const push = await get('PushSplitter');
  const shakeable = await get('ShakeableSplitter');

  const Factory = await deploy('SplitterFactory', {
    from: deployer,
    log: true,
  }) as DeployResult;

  const factory = SplitterFactory__factory.connect(Factory.address, signer);
  await factory.addSplitterType(ethers.utils.keccak256(Buffer.from("push")), push.address);
  await factory.addSplitterType(ethers.utils.keccak256(Buffer.from("shakeable")), shakeable.address);
  
};
export default func;
func.dependencies = ['PushSplitter'];
func.dependencies = ['ShakeableSplitter'];
func.tags = ['splitters'];