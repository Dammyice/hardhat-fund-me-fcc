const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { expect, assert } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")
const {
    isCallTrace
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function() {
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther("0.1") // 1 ETH
          beforeEach(async function() {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })
          it("allow people to fund and withdraw", async function() {
              await fundMe.fund({ value: sendValue })
              const transactionResponse = await fundMe.cheaperWithdraw()
              const transactionReceipt = await transactionResponse.wait(1)

              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })
