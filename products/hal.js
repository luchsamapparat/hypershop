const { Resource } = require('hal');
const { map, omit } = require('lodash');
const { getRootUri, getProductUri } = require('./uris');
const shoppingCartUris = require('../shoppingCart/uris');
const { cfha } = require('../shared/namespaces');

module.exports = {
    fromProducts,
    fromProduct
};

function fromProducts(products) {
    return Resource(
        {},
        getRootUri()
    )
        .embed(
            cfha('products'),
            map(products, fromProduct)   
        );
}

function fromProduct(product) {
    return Resource(
        omit(product, ['_id']),
        getProductUri(product._id)
    )
        .link(cfha('add-to-shopping-cart'), shoppingCartUris.getShoppingCartItemsUri());
}
