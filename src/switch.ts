import {
    whichHotApp,
    switchMessage,
    clearCurrentWidow,
    saveHotApps,
    MakeHotAppActive,
    getAllProcessThatMatchAppName,
    registerNotifierOnClick,
    minimizeCurrentWindow,
    getHotApps,
    makeClientActive,
} from './utils';

import { SwitchHotApp } from './interfaces';
import TemplateText from './text';
import { Switch } from './enums';
import { InterProcessChannel } from './interprocess';

const interChannel = new InterProcessChannel();
const ioHook = require('iohook');
const checkcaps = require('check-caps');
const secondKeyPressTimeout = 600;
let clientPID = null;


let hotapps: SwitchHotApp[] = getHotApps();

const useFnKey = true;
let timer = null;

/**
 * Called to activate hot app switching
 * @param  {} event
 */


function react(event) {

    let hotApp = whichHotApp(event.rawcode, hotapps);
    if (hotApp != null) {
        // Minimize current window
        minimizeCurrentWindow();
        // If the hot app that match the rawcode is found...
        // get all process that match hot app's name and path
        let processes = getAllProcessThatMatchAppName(hotApp.name, hotApp.path);
        console.log('matched windows', processes);
        if (processes) {
            // minimizeCurrentWindow();
            // Make hotapp active
            MakeHotAppActive(processes);
            interChannel.sendlastSwitched(hotApp);
        } else {
            switchMessage(Switch.ERROR_NOTI, { title: TemplateText.errorTitle, message: TemplateText.processNotFound(hotApp.name), hotApp: hotApp });
        }
    } else {
        // if not hot app found make the client active..
        if(event.rawcode >= 48 && event.rawcode <= 58)
        {
            // makeClientActive(clientPID);
            switchMessage(Switch.ERROR_NOTI, { title: TemplateText.errorTitle, message: TemplateText.noHotApp(event.rawcode-48), hotApp: hotApp });
        }

    }
}


/**
 * This method activates hot app switch if user turns on caps key
 * or hold the alt key
 * @param  {} event
 */
function capsMethod(event) {
    // If caplocks on is react..
    if (checkcaps.status() || event.altKey) {
        react(event);
    }
}

/**
 * This methond activates hot app switch if user click (fn | r alt) key then the hot app code
 * and any key afterwards
 * @param  {} event
 */
function fnMethod(event) {
    if (event.altKey) {
        react(event);
    }
}




/*
 * Fires when on user's keyup
 */

ioHook.on('keyup', event => {
    // console.log(event);
    if (useFnKey) {
        // Fn or Right Alt key capture methohd.
        fnMethod(event);
    } else {
        // caps capture method.
        capsMethod(event);
    }
});


ioHook.on('keydown', event => {
    if (event.altKey) {
        interChannel.sendShowClient();
    }
});

// Register and start hook.
ioHook.start();

// Alternatively, pass true to start in DEBUG mode.
ioHook.start(true);

// Registers the on toast click event handler.
registerNotifierOnClick();

interChannel.emitter.on('update-hot-apps', (happs) => {
    hotapps = happs;
    console.log(hotapps);
    console.log('[info] Hot apps update recived');
    saveHotApps(happs);
})


interChannel.emitter.on('client-pid', (pid) => {
    clientPID = pid;
    console.log('[info] Hot client pid: ' + pid);
})