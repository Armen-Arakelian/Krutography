import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { Reverter } from "@/test/helpers/reverter";
import { wei } from "@/scripts/utils/utils";
import { Krutography } from "@ethers-v5";
import { reverts } from "truffle-assertions";

describe("Krutography", () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let SECOND: SignerWithAddress;

  let krutography: Krutography;

  before(async () => {
    [OWNER, SECOND] = await ethers.getSigners();

    const Krutography = await ethers.getContractFactory("Krutography");
    krutography = await Krutography.deploy("test");

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("#general", () => {
    it("general test", async () => {
      expect(await krutography.owner()).to.eq(OWNER.address);
      await krutography.addNewPhoto(100, 1, "test1", "test1");
      await krutography.addNewPhoto(300, 3, "test2", "test2");

      expect((await krutography.photos(1)).name).to.eq("test1");
      expect(await krutography.balanceOf(OWNER.address, 1)).to.eq(100);

      expect((await krutography.photos(2)).name).to.eq("test2");
      expect(await krutography.balanceOf(OWNER.address, 2)).to.eq(300);

      await krutography.deletePhoto(1);

      expect((await krutography.photos(1)).name).to.eq("");
      expect(await krutography.balanceOf(OWNER.address, 1)).to.eq(0);

      await reverts(
        krutography.safeTransferFrom(OWNER.address, SECOND.address, 2, 50, "0x"),
        "Krutorgaphy: unable to transfer tokens from unfinalized photo"
      );

      await krutography.finalizePhoto(2);

      await krutography.safeTransferFrom(OWNER.address, SECOND.address, 2, 50, "0x");
      expect(await krutography.balanceOf(OWNER.address, 2)).to.eq(250);
      expect(await krutography.balanceOf(SECOND.address, 2)).to.eq(50);

      await reverts(krutography.deletePhoto(2), "Krutography: impossible to delete finalized photo");
    });
  });
});
