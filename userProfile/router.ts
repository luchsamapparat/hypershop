import * as config from 'config';
import * as express from 'express';
import { sendResponse } from '../shared/util';
import * as hal from './hal';
import * as html from './html';
import * as userProfileService from './service';
import { getBasePath, getRootPath } from './uris';

export const basePath = getBasePath();

export const router = express.Router();

router.get(getRootPath(), (request, response) => {
    userProfileService.getUserProfile()
        .then(userProfile => sendResponse(response, {
            'json': userProfile,
            'html': html.fromUserProfile(userProfile),
            [config.app.mediaType.hal]: hal.fromUserProfile(userProfile)
        }));
});