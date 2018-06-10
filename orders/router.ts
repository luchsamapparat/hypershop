import * as config from 'config';
import * as express from 'express';
import { escapeRegExp } from 'lodash';
import { sendResponse } from '../shared/util';
import * as shoppingCartUris from '../shoppingCart/uris';
import { EntityId } from '../store/model';
import * as userProfileUris from '../userProfile/uris';
import * as hal from './hal';
import * as html from './html';
import { OrderStatus } from './model';
import * as orderService from './service';
import { getBasePath, getOrderPath, getOrderUri, getRootPath } from './uris';

export const basePath = getBasePath();

export const router = express.Router();

router.get(getRootPath(), (request, response) => {
    orderService.getOrders()
        .then(orders => sendResponse(response, {
            json: orders,
            html: html.fromOrders(orders),
            [config.app.mediaType.hal]: hal.fromOrders(orders)
        }));
});

router.post(getRootPath(), (request, response) => {
    let statusCode = 201;
    // TODO: use mime type matcher
    if (request.get('Accept')!.match(escapeRegExp('text/html'))) {
        statusCode = 303;
    }

    let items;
    let billingAddress;
    let shippingAddress;
    let payment;

    // // TODO: use mime type matcher
    if (request.get('Content-Type') === config.app.mediaType.hal) {
        items = request.body.items.map(
            (item: EntityId) => item.replace(new RegExp(shoppingCartUris.getShoppingCartItemUri('(.*)')), '$1')
        );
        billingAddress = request.body.billingAddress.replace(new RegExp(userProfileUris.getAddressUri('(.*)')), '$1');
        shippingAddress = request.body.shippingAddress.replace(new RegExp(userProfileUris.getAddressUri('(.*)')), '$1');
        payment = request.body.payment.replace(new RegExp(userProfileUris.getPaymentOptionUri('(.*)')), '$1');
    } else {
        items = request.body.items;
        billingAddress = request.body.billingAddress;
        shippingAddress = request.body.shippingAddress;
        payment = request.body.payment;
    }
    
    orderService.createOrder({
        items,
        billingAddress,
        shippingAddress,
        payment
    })
        .then(orderId => response.redirect(statusCode, getOrderUri(orderId)));
});

router.get(getOrderPath(), (request, response) => {
    orderService.getOrder(request.params.orderId)
        .then(order => sendResponse(response, {
            'json': order,
            'html': html.fromOrder(order),
            [config.app.mediaType.hal]: hal.fromOrder(order)
        }));
});

router.patch(getOrderPath(), (request, response) => {
    orderService.updateOrderStatus(
        request.params.orderId,
        request.body.status
    )
        .then(() => response.redirect(303, getOrderUri(request.params.orderId)));
});

router.delete(getOrderPath(), (request, response) => {
    orderService.updateOrderStatus(
        request.params.orderId,
        OrderStatus.Cancelled
    )
        .then(() => response.redirect(303, getOrderUri(request.params.orderId)));
});
