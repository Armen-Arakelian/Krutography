pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Krutography is Ownable, ERC1155 {
    using Strings for uint;

    struct Photo {
        uint circulation;
        uint initialCostInUsd;
        string name;
        string story;
        bool isFinalized;
    }

    uint public currentId;
    mapping(uint => Photo) public photos;

    event PhotoAdded(Photo photo_);

    constructor(string memory uri_) ERC1155(uri_) {}

    function uri(uint tokenId_) public view override returns (string memory) {
        return
            bytes(super.uri(tokenId_)).length > 0
                ? string(abi.encodePacked(super.uri(tokenId_), tokenId_.toString()))
                : "";
    }

    function addNewPhoto(
        uint circulation_,
        uint initialCost_,
        string memory name_,
        string memory story_
    ) external onlyOwner {
        currentId++;

        photos[currentId] = Photo(circulation_, initialCost_, name_, story_, false);
        _mint(owner(), currentId, circulation_, "");

        emit PhotoAdded(Photo(circulation_, initialCost_, name_, story_, false));
    }

    function deletePhoto(uint id_) external onlyOwner {
        require(!photos[id_].isFinalized, "Krutography: impossible to delete finalized photo");

        _burn(owner(), id_, balanceOf(owner(), id_));
        delete photos[id_];
    }

    function finalizePhoto(uint id_) external onlyOwner {
        photos[id_].isFinalized = true;
    }

    function _beforeTokenTransfer(
        address operator_,
        address from_,
        address to_,
        uint256[] memory ids_,
        uint256[] memory amounts_,
        bytes memory data_
    ) internal override {
        if (to_ != address(0) && from_ != address(0)) {
            for (uint i = 0; i < ids_.length; i++) {
                require(
                    photos[ids_[i]].isFinalized,
                    "Krutorgaphy: unable to transfer tokens from unfinalized photo"
                );
            }
        }
    }
}
