//SPDX-License-Identifierf: MIT
pragma solidity ^0.8.4;

contract ConsumerShop {
    address owner;

    struct Product {
        uint sku;
        string name;
        string image;
        string description;
        uint price;
        uint quantityAvailable;
        uint quantitySold;
    }

    Product[] public products;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner allowed");
        _;
    }

    event ProductCreated(
        uint indexed index,
        uint indexed sku,
        string name,
        string image,
        string description,
        uint quantityAvailable,
        uint price
    );

    event ProductSold(
        uint indexed index,
        uint indexed sku,
        uint oldQuantitySold,
        uint newQuantitySold
    );

    constructor() {
        owner = msg.sender;
    }

    /**
     *@dev creates a new product and adds it to the `products` array
     *@param _sku - a unique ID for product
     *@param _image - a url of product image
     *@param _description - a label or short description of the product
     *@param _price - price at which the product will be sold
     *@param _quantityAvailable - quantity of products available for sale
     */
    function createProduct(
        uint _sku,
        string memory _name,
        string memory _image,
        string memory _description,
        uint _price,
        uint _quantityAvailable
    ) public onlyOwner {
        // we make some assumption that information on sku, name, and price
        // are the least requirements of a product
        require(_sku > 0, "SKU is required");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_price > 0, "Price cannot be zero");

        //make a new product using the key-value pair approach
        //and push into the products array
        products.push(
            Product({
                sku: _sku,
                name: _name,
                image: _image,
                description: _description,
                price: _price,
                quantityAvailable: _quantityAvailable,
                quantitySold: 0
            })
        );

        //emit a `ProductCreated` event to log to the blockchain
        emit ProductCreated(
            products.length,
            _sku,
            _name,
            _image,
            _description,
            _quantityAvailable,
            _price
        );
    }

    /**
     *@dev this function allows a user to buy a product
     *@param index - index of the product in the `products` array
     */
    function buyProduct(uint index) external payable {
        //make sure the index is within range of the array
        require(index <= products.length - 1, "Index is out of range");
        //get the product
        Product storage product = products[index];

        require(msg.value >= product.price, "Amount sent is not enough");

        uint oldQuantitySold = product.quantitySold;
        product.quantityAvailable -= 1;
        product.quantitySold += 1;

        emit ProductSold(
            index,
            product.sku,
            oldQuantitySold,
            product.quantitySold
        );
    }

    //@dev additional functionality to withdraw funds, and update product information
    //Yet the object here is to demonstract events in solidity so we stick to it.

    //enable our contract to receive eth with fallback function
    receive() external payable {}

    fallback() external payable {}
}
