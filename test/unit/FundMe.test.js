const { ethers, deployments, getNamedAccounts } = require("hardhat")
const { expect, assert } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function() {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.utils.parseEther("0.1") // 1 ETH
          beforeEach(async function() {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", async function() {
              it("sets the aggregator addresses correctly", async function() {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", async function() {
              it("Fails if you do not send enough ETH", async function() {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "did not send enough funds"
                  )
              })

              it("Updated the amount funded data structure", async function() {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })

              it("Add funder to array of funders", async function() {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunders(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("Withdraw", async function() {
              beforeEach(async function() {
                  await fundMe.fund({ value: sendValue })
              })
              it("Withdraw ETH from a single founder", async function() {
                  //Arrange
                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  console.log(startingFundMeBalance.toString())
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  console.log(startingDeployerBalance.toString())
                  //Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  console.log(gasCost)
                  const endingFundmebalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  //Assert
                  assert.equal(endingFundmebalance, 0)
                  assert.equal(
                      startingFundMeBalance.add(startingDeployerBalance),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })
              it("Allows us to withdraw with multiple funders", async function() {
                  //Arrange
                  const accounts = await ethers.getSigners()

                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )

                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  console.log(startingFundMeBalance.toString())
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  console.log(startingDeployerBalance.toString())
                  //Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  console.log(gasCost)
                  const endingFundmebalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  //Assert
                  assert.equal(endingFundmebalance, 0)
                  assert.equal(
                      startingFundMeBalance.add(startingDeployerBalance),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  await expect(fundMe.getFunders(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("Only allow the owner to withdraw", async function() {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedcontract = await fundMe.connect(
                      attacker
                  )

                  await expect(attackerConnectedcontract.cheaperWithdraw()).to
                      .be.reverted
              })
          })
      })
