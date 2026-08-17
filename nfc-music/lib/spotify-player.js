'use strict';

const axios = require('axios');

class SpotifyPlayer {

    constructor(options) {
        this.auth = options.auth;
    }

    async play(uri, deviceId) {

        const accessToken = await this.auth.getAccessToken();

        const body = {
            context_uri: uri
        };

        if (deviceId) {
            body.device_id = deviceId;
        }

        const response = await axios.put(
            'https://api.spotify.com/v1/me/player/play',
            body,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.status === 204;
    }
}

module.exports = SpotifyPlayer;
