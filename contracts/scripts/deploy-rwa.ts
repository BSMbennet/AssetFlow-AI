import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const admin = process.env.ASSETFLOW_ADMIN || deployer.address;
  const issuer = process.env.ASSETFLOW_ISSUER || deployer.address;
  const name = process.env.ASSETFLOW_TOKEN_NAME || "AssetFlow RWA";
  const symbol = process.env.ASSETFLOW_TOKEN_SYMBOL || "AF-RWA";
  const assetId = process.env.ASSETFLOW_ASSET_ID;
  const maxSupply = process.env.ASSETFLOW_MAX_SUPPLY;

  if (!assetId || !maxSupply) throw new Error("ASSETFLOW_ASSET_ID and ASSETFLOW_MAX_SUPPLY are required");

  const factory = await ethers.getContractFactory("AssetFlowRWA");
  const token = await factory.deploy(name, symbol, assetId, maxSupply, admin, issuer);
  await token.waitForDeployment();
  console.log(JSON.stringify({
    contract: await token.getAddress(),
    network: (await ethers.provider.getNetwork()).chainId.toString(),
    assetId,
    symbol,
    maxSupply,
    admin,
    issuer,
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
