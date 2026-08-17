'use strict';

const libQ = require('kew');
const createTagHandler = require('./tag-handler');
const Player = require('./lib/player');
const SpotifyPlayer = require('./lib/spotify-player');
const SpotifyOAuth = require('./lib/spotify-oauth');
const SpotifyAuth = require('./lib/spotify-auth');
const spotifyConfig = require('./lib/spotify-config');


module.exports = NfcMusic;

function NfcMusic(context) {
    const self = this;

    this.context = context;
    this.commandRouter = context.coreCommand;
    this.logger = context.logger;
    this.configManager = context.configManager;

    this.config = null;
    this.handler = null;
}


/*
 * Volumio lifecycle
 * -----------------------------------------------------------------------------
 *
 * onVolumioStart()
 * Called when Volumio has finished starting up.
 *
 * This is where plugin configuration is loaded.
 *
 */

NfcMusic.prototype.onVolumioStart = function () {
    const configFile =
        this.commandRouter.pluginManager.getConfigurationFile(
            this.context,
            'config.json'
        );

    this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);

    this.logger.info('NFC Music: Volumio gestart');

    return libQ.resolve();
};


/*
 * onStart()
 * -----------------------------------------------------------------------------
 *
 * Called when the plugin is started.
 *
 * This is where we initialise the components required by the NFC controller:
 *
 * NFC tag
 *    ↓
 * Tag handler
 *    ↓
 * Player
 *    ↓
 * Spotify player
 *    ↓
 * Spotify API
 *
 */

NfcMusic.prototype.onStart = function () {
    const auth = new SpotifyAuth({
        clientId: spotifyConfig.clientId
    });

    const spotifyPlayer = new SpotifyPlayer({
        auth: auth
    });

    const player = new Player({
        spotify: spotifyPlayer
    });

    this.handler = createTagHandler(
        player,
        this.logger
    );

    this.logger.info('NFC Music plugin gestart');
    this.logger.info('NFC Music: tag handler geïnitialiseerd');

    /*
     * NFC reader initialisation will be added here.
     *
     * Once the NFC reader is connected, a detected tag should eventually
     * result in:
     *
     *     this.handler.handleTag(tag);
     *
     */

    return libQ.resolve();
};


/*
 * onStop()
 * -----------------------------------------------------------------------------
 *
 * Called when the plugin is stopped.
 *
 * Any resources opened by the plugin should be released here.
 *
 * For example:
 *
 * - stop the NFC reader
 * - remove NFC event listeners
 * - close open connections
 *
 */

NfcMusic.prototype.onStop = function () {
    this.logger.info('NFC Music plugin gestopt');

    /*
     * NFC reader cleanup will be added here.
     */

    this.handler = null;

    return libQ.resolve();
};


/*
 * onRestart()
 * -----------------------------------------------------------------------------
 *
 * Called when the plugin is restarted.
 *
 * Optional: use this if the plugin needs special restart handling.
 *
 */

NfcMusic.prototype.onRestart = function () {
    this.logger.info('NFC Music plugin herstart');
};


/*
 * Configuration Methods
 * -----------------------------------------------------------------------------
 *
 * These methods are part of the standard Volumio plugin interface.
 *
 */


/*
 * getUIConfig()
 * -----------------------------------------------------------------------------
 *
 * Returns the configuration used by the Volumio UI.
 *
 * The generated Volumio plugin template uses UIConfig.json together with
 * the appropriate language file.
 *
 */

NfcMusic.prototype.getUIConfig = function () {
    const defer = libQ.defer();

    const langCode =
        this.commandRouter.sharedVars.get('language_code');

    this.commandRouter.i18nJson(
        __dirname + '/i18n/strings_' + langCode + '.json',
        __dirname + '/i18n/strings_en.json',
        __dirname + '/UIConfig.json'
    )
        .then((uiconf) => {
            defer.resolve(uiconf);
        })
        .fail(() => {
            defer.reject(new Error());
        });

    return defer.promise;
};


/*
 * getConfigurationFiles()
 * -----------------------------------------------------------------------------
 *
 * Tell Volumio which configuration files belong to this plugin.
 *
 */

NfcMusic.prototype.getConfigurationFiles = function () {
    return ['config.json'];
};


/*
 * setUIConfig()
 * -----------------------------------------------------------------------------
 *
 * Called when the configuration is changed through the Volumio UI.
 *
 * Add configuration handling here when the plugin gets configurable options.
 *
 */

NfcMusic.prototype.setUIConfig = function (data) {
    // Perform configuration update tasks here.
};


/*
 * getConf()
 * -----------------------------------------------------------------------------
 *
 * Retrieve a configuration value.
 *
 */

NfcMusic.prototype.getConf = function (varName) {
    return this.config.get(varName);
};


/*
 * setConf()
 * -----------------------------------------------------------------------------
 *
 * Set a configuration value.
 *
 */

NfcMusic.prototype.setConf = function (varName, varValue) {
    this.config.set(varName, varValue);
};


/* * Spotify Authorisation
 * -----------------------------------------------------------------------------
 *
 * Triggered from the Volumio UI.
 *
 * This method starts the OAuth flow to link a Spotify account.
 *
 */

NfcMusic.prototype.startSpotifyAuth = async function () {
    this.logger.info('Spotify OAuth gestart');

    try {
        this.logger.info('DEBUG 1: startSpotifyAuth called');

        const SpotifyOAuth = require('./lib/spotify-oauth');
        this.logger.info('DEBUG 2: class loaded');

        const oauth = new SpotifyOAuth();
        this.logger.info('DEBUG 3: instance created');

        const url = oauth.createAuthorizationUrl();

        this.logger.info('OAuth URL: ' + url);
        this.logger.info('DEBUG 4: url created');

        /*
         * Update OAuth URL in de Volumio configuratiepagina.
         */
        try {
            const respconfig =
                await this.commandRouter.getUIConfigOnPlugin(
                    'system_hardware',
                    'nfc-music',
                    {}
                );

            this.logger.info(
                'DEBUG UI CONFIG ontvangen'
            );

            if (
                respconfig &&
                respconfig.sections &&
                respconfig.sections.length > 0
            ) {
                const section = respconfig.sections[0];

                if (section.content) {
                    const field = section.content.find(
                        c => c.id === 'oauth_url'
                    );

                    if (field) {
                        field.value = url;

                        this.logger.info(
                            'OAuth URL toegevoegd aan UI-config'
                        );

                        this.logger.info(
                            'DEBUG: pushUiConfig wordt uitgevoerd');

                        this.commandRouter.broadcastMessage(
                            'pushUiConfig',
                            respconfig
                        );
                    } else {
                        this.logger.warn(
                            'oauth_url veld niet gevonden'
                        );
                    }
                }
            }
        } catch (uiErr) {
            this.logger.error(
                'Fout bij OAuth UI-config: ' + uiErr.stack
            );
        }

        this.commandRouter.pushToastMessage(
            'info',
            'Spotify koppelen',
            'Spotify OAuth gestart'
        );

        /*
         * OAuth server op de achtergrond starten.
         */
        oauth.start().catch(err => {
            this.logger.error(
                'OAuth server fout: ' + err.stack
            );
        });

    } catch (err) {
        this.logger.error(
            'OAuth fout: ' + err.stack
        );
    }
};
