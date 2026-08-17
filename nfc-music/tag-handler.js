'use strict';

function createTagHandler(player, logger = console) {

    async function handleTag(tag) {

        if (!tag.actions || !Array.isArray(tag.actions)) {
            throw new Error('Geen actions gedefinieerd');
        }

        for (const action of tag.actions) {

            logger.info(`➡️ Actie: ${action.action}`);

            switch (action.action) {

                case 'playSpotify':
                    await player.playSpotify(action.uri);
                    break;

                case 'playLocal':
                    await player.playLocal(action);
                    break;

                case 'playLocalAlbum':
                    await player.playLocalAlbum(action.artist, action.album);
                    break;

                case 'playLocalPlaylist':
                    await player.playLocalPlaylist(action.name);
                    break;

                case 'pause':
                    await player.pause();
                    break;

                case 'resume':
                    await player.resume();
                    break;

                case 'next':
                    await player.next();
                    break;

                case 'previous':
                    await player.previous();
                    break;

                default:
                    throw new Error(`Onbekende action: ${action.action}`);
            }
        }
    }

    return {
        handleTag
    };
}

module.exports = createTagHandler;
