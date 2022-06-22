const {ethers} = require("hardhat");

async function main(){

    const ConsumerShopContract = await ethers.getContractFactory("ConsumerShop");

    const deployedConsumerShopContract = await ConsumerShopContract.deploy();

    await deployedConsumerShopContract.deployed();

    console.log("Contract address :", deployedConsumerShopContract.address);
}


main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    })