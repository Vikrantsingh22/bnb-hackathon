const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiTokenEscrow", function () {
  let escrow, owner, user1, token;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockToken = await ethers.getContractFactory("ERC20PresetMinterPauser");
    token = await MockToken.deploy("MockToken", "MTK");
    await token.deployed();

    // Deploy escrow
    const MultiTokenEscrow = await ethers.getContractFactory("MultiTokenEscrow");
    escrow = await MultiTokenEscrow.deploy();
    await escrow.deployed();

    // Whitelist token
    await escrow.whitelistToken(token.address);
  });

  it("should allow user to deposit ERC20", async function () {
    await token.mint(user1.address, ethers.utils.parseEther("100"));
    await token.connect(user1).approve(escrow.address, ethers.utils.parseEther("10"));

    await escrow.connect(user1).participate(
      ethers.utils.parseEther("10"),
      1,
      1,
      0, // ParticipationType.SideBet
      false,
      token.address,
      2000 // odds
    );

    const deposit = await escrow.getUserDeposit(user1.address, token.address);
    expect(deposit).to.equal(ethers.utils.parseEther("10"));
  });
});
