'use strict';
const axios = require('axios');

class Player {

    constructor(options) {
        this.spotify = options.spotify;
    }

// Een track van Spotify starten (Connect moet verbonden zijn!)
    async playSpotify(uri, deviceId) {
        return this.spotify.play(uri, deviceId);
    }

// Een lokale track via Volumio MPD starten
    async playLocal(track) {
        const response = await axios.post(
            'http://127.0.0.1:3000/api/v1/replaceAndPlay',
            {
                service: track.service || 'mpd',
                type: track.type || 'track',
                uri: track.uri,
                title: track.title,
                artist: track.artist,
                album: track.album,
                trackType: track.trackType
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
         );

         return response.status === 200;
    }

    // Een lokaal album zoeken en via Volumio MPD starten
    async playLocalAlbum(artist, album) {
        // Zoek het album via de Volumio library
        const searchResponse = await axios.get(
            'http://127.0.0.1:3000/api/v1/search',
            {
                params: {
                    query: album
                }
            }
        );

        const lists = searchResponse.data?.navigation?.lists || [];

    // Zoek een album waarvan zowel artiest als album overeenkomen
        let albumItem = null;

        for (const list of lists) {
            const items = list.items || [];

            albumItem = items.find(item =>
                item.type === 'folder' &&
                item.artist === artist &&
                item.title === album
            );

            if (albumItem) {
                break;
            }
        }

        if (!albumItem) {
            throw new Error(`Album niet gevonden: ${artist} - ${album}`);
        }

        // Gebruik de URI die Volumio zelf heeft gevonden
        const response = await axios.post(
            'http://127.0.0.1:3000/api/v1/replaceAndPlay',
            {
                service: 'mpd',
                type: 'folder',
                uri: albumItem.uri
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.status === 200;
    }

    // Een lokale Volumio-playlist starten
    async playLocalPlaylist(name) {
        const response = await axios.get(
            'http://127.0.0.1:3000/api/v1/commands',
            {
                params: {
                    cmd: 'playplaylist',
                    name: name
                }
            }
        );

        return response.status === 200;
    }

    /* Controls structuur backup voor Spotify specifiek. Vervangen door algemene Volumio controls. 
    async pause/play/next/previous() {
        const accessToken = await this.spotify.auth.getAccessToken();

        await axios.put(
            'https://api.spotify.com/v1/me/player/pause/play/next/previous',
            {},
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

    return true;
    } */

    async pause() {
        const response = await axios.get(
            'http://127.0.0.1:3000/api/v1/commands?cmd=pause'
        );

        return response.status === 200;
    }

    async resume() {
        const response = await axios.get(
            'http://127.0.0.1:3000/api/v1/commands?cmd=play'
        );

        return response.status === 200;
    }

    async next() {
        const response = await axios.get(
            'http://127.0.0.1:3000/api/v1/commands?cmd=next'
        );

        return response.status === 200;
    }

    async previous() {
        const response = await axios.get(
            'http://127.0.0.1:3000/api/v1/commands?cmd=prev'
        );

        return response.status === 200;
    }



    async setVolume(volume) {
        throw new Error('Volume nog niet geïmplementeerd');
    }
}

module.exports = Player;
