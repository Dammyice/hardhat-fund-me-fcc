// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers, deployments, getNamedAccounts, network } = require("hardhat")

async function main() {
    deployer = (await getNamedAccounts()).deployer
    fundMe = await ethers.getContract("FundMe", deployer)
    console.log("Funding Contract....")

    const transactionResponse = await fundMe.fund({
        value: ethers.utils.parseEther("0.1")
    })
    await transactionResponse.wait(1)
    console.log("Funding Contract")
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
