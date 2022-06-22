import { ethers } from "ethers";
import { useEffect, useState } from "react";

import "./App.css";
import {
    abi,
    CONTRACT_ADDRESS,
    DEFAULT_PRODUCT_IMAGE,
    EVENTS,
} from "./constants";

//get contract instance
const getcontract = () => {
    if (!window.ethereum) {
        throw new Error("Install MetaMask browser extension");
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);

    const signer = provider.getSigner();

    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

    return contract;
};

const getProducts = async (contract) => {
    let products = [];

    const numberOfproducts = await contract.numberOfProducts();
    for (let i = 0; i < numberOfproducts; i++) {
        const productCall = new Promise(async (resolve) => {
            const product = await contract.products(i);

            const {
                sku,
                name,
                image,
                description,
                price,
                quantityAvailable,
                quantitySold,
            } = product;

            resolve({
                index: i,
                sku,
                name,
                image,
                description,
                price,
                quantityAvailable,
                quantitySold,
            });
        });

        products.push(productCall);
    }

    return await Promise.all(products);
};

//generate product card
function Card({ productInfo, ...props }) {
    const [loading, setLoading] = useState();

    const {
        index,
        sku,
        name,
        image,
        description,
        price,
        quantityAvailable,
        quantitySold,
    } = productInfo;

    const buyProduct = async () => {
        const contract = getcontract();
        try {
            setLoading(true);
            const txn = await contract.buyProduct(index, { value: price });
            await txn.wait();
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="card col-md-4 col-lg-3"
            style={{ width: "18rem", margin: "5px" }}
        >
            <img
                src={image ? image : DEFAULT_PRODUCT_IMAGE}
                className="card-img-top"
                alt="..."
            ></img>

            <div className="card-body">
                <span>SKU: #{sku.toString()}</span>
                <h5 className="card-title">{name}</h5>
                <p className="card-text">{description}</p>
                <p className="card-text">Price: {price.toString()} Eth</p>
                <p className="card-text">
                    Available: {quantityAvailable?.toString()}
                </p>
                <p className="card-text">Sold: {quantitySold?.toString()}</p>
                <button
                    className="btn btn-primary d-flex align-items-center"
                    onClick={buyProduct}
                    disabled={loading}
                >
                    Buy 1 &nbsp;
                    {loading && (
                        <div
                            className="spinner-border text-light"
                            role="status"
                        >
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
}

function App() {
    //tracks products
    const [products, setProducts] = useState({});

    //tracks loading activity
    const [loading, setLoading] = useState(false);

    //fetch products once when the component is rendered
    useEffect(() => {
        try {
            setLoading(true);
            const contract = getcontract();
            getProducts(contract).then((products) => setProducts(products));
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        //get smartcontract connection instance
        const contract = getcontract();

        //subscribing to product created event
        //note that JS spread (...) operator is used to collect all arguments
        //that are passed to the callback function as eventData
        contract.on(EVENTS.PRODUCT_CREATED, (...eventData) => {
            const {
                index,
                sku,
                name,
                image,
                description,
                price,
                quantityAvailable,
            } = eventData;

            //used as key to find product in `products`
            const skuString = sku?.toString();

            setProducts((prevProducts) => {
                return {
                    ...prevProducts,
                    [skuString]: {
                        index,
                        sku,
                        name,
                        image,
                        description,
                        price,
                        quantityAvailable,
                    },
                };
            });
        });

        //subscribing to product sold event
        //note again that JS spread (...) operator is used to collect all arguments
        //that are passed to the callback function as eventData
        contract.on(EVENTS.PRODUCT_SOLD, (...eventData) => {
            //get product info from event data
            const {
                sku,
                quantitySold: totalQuantitySold,
                quantityAvailable: newQuantityAvailable,
            } = eventData;

            //used as key to identify product in `products`
            const skuString = sku?.toString();

            setProducts((prevProducts) => {
                //find product
                const oldProductDetails = prevProducts[skuString];

                //generate updated product info to replace old product info
                const updatedProductDetails = {
                    ...oldProductDetails,
                    totalQuantitySold,
                    newQuantityAvailable,
                };

                return {
                    ...prevProducts,
                    [skuString]: updatedProductDetails,
                };
            });
        });

        return () => {
            //remove all contract listeners when component is unmounted
            //it is important to remove dangling listeners to prevent multiple
            //listener function calls on event which may lead to multiiple rendering of a product.
            contract.removeAllListeners();
        };
    }, []);

    if (loading) {
        return <h1>Loading...</h1>;
    }

    console.log(products);
    return (
        <>
            <div className="container">
                <div className="row">
                    {/* product listings */}
                    {Object.values(products)?.map((product, idx) => (
                        <Card key={idx} productInfo={product} />
                    ))}
                </div>
            </div>
        </>
    );
}

export default App;
