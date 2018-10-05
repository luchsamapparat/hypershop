import { Response } from 'express';
import { isArray, mapValues } from 'lodash';
import { compactWithDomainContext } from '../profile/context';
import { jsonHalWithProfile, jsonLdWithProfile } from './mediaType';

const handlerMapping = {
    json: handleJsonResponse,
    html: handleHtmlResponse,
    [jsonHalWithProfile]: handleJsonHalResponse,
    [jsonLdWithProfile]: handleJsonLdResponse
};

export type ResponseBody = any;

export function sendResponse(response: Response, responseBodies: { [key: string]: ResponseBody }) {
    response
        .format(mapValues(
            responseBodies,
            (responseBody, mediaType) => () => {
                handlerMapping[mediaType](response, responseBody);
            }
        ));
}

function handleHtmlResponse(response: Response, responseBody: ResponseBody) {
    let view = responseBody;
    let locals = {};

    if (isArray(responseBody)) {
        view = responseBody[0];
        locals = responseBody[1];
    }

    response.render(view, locals);
}

function handleJsonLdResponse(response: Response, responseBody: ResponseBody) {
    compactWithDomainContext(responseBody)
        .then(body => {
            return response
            .type(jsonLdWithProfile)
            .send(body);
        });
}

function handleJsonHalResponse(response: Response, responseBody: ResponseBody) {
    handleJsonResponse(response, responseBody, jsonHalWithProfile);
}

function handleJsonResponse(response: Response, responseBody: ResponseBody, mediaType = 'json') {
    response
        .type(mediaType)
        .send(responseBody);
}