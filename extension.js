// SPDX-License-Identifier: GPL-3.0-only
/* Minimize-shelf
   Copyright 2020-2021 Guillaume Pasquet
   Copyright 2022 Baptiste Darthenay
   Copyright 2026 Chris Lottes
   License: GPLv3
   Contains some code from Simple Task Bar extension by fthx
   Contains some code from All Windows extension by lyonel
*/

import Mtk from 'gi://Mtk';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { Direction } from './utils/settings.js';

const ICON_SIZE = 22;

class WindowList {
    constructor(side) {
        this.side = side;
        this.apps_menu = new St.BoxLayout({});
        this.actor = this.apps_menu;

        this._updateMenu();
        this._restacked = global.display.connect(
            'restacked',
            this._updateMenu.bind(this)
        );
        this._window_change_monitor = global.display.connect(
            'window-left-monitor',
            this._updateMenu.bind(this)
        );
        this._workspace_removed = global.workspace_manager.connect(
            'workspace-removed',
            this._updateMenu.bind(this)
        );
        this._workspace_changed = global.workspace_manager.connect(
            'active-workspace-changed',
            this._updateMenu.bind(this)
        );
        this._workspace_added = global.workspace_manager.connect(
            'workspace-added',
            this._updateMenu.bind(this)
        );
    }

    _destroy() {
        global.display.disconnect(this._restacked);
        global.display.disconnect(this._window_change_monitor);
        global.workspace_manager.disconnect(this._workspace_removed);
        global.workspace_manager.disconnect(this._workspace_changed);
        global.workspace_manager.disconnect(this._workspace_added);
        this.apps_menu.destroy();
    }

    _updateMenu() {
        this.apps_menu.destroy_all_children();

        this.tracker = Shell.WindowTracker.get_default();
        this.workspaces_count = global.workspace_manager.get_n_workspaces();

        let workspace = global.workspace_manager.get_active_workspace();
        this.windows = workspace.list_windows();

        for (let meta_window of this.windows) {
            meta_window.set_icon_geometry(this._animationAnchorArea(workspace));
        }

        for (let meta_window of this.windows.filter(w => w.minimized)) {
            this.box = new St.Bin({
                visible: true,
                reactive: true,
                can_focus: true,
                track_hover: true,
            });
            this.box.window = meta_window;
            this.app = this.tracker.get_window_app(this.box.window);
            this.box.connect('button-press-event', () => {
                this._activateWindow(workspace, meta_window);
            });
            this.box.icon = this.app.create_icon_texture(ICON_SIZE);
            this.box.style_class = 'focused-app';
            this.box.set_child(this.box.icon);
            this.apps_menu.add_child(this.box);
        }
    }

    _animationAnchorArea(ws) {
        const width = ws.get_display().get_size()[0];
        // Some arbitrary values in pixels because I can’t figure out
        // how to get the apps_menu position
        const anchor = this.side.anchor(width);
        if (this.area?.x !== anchor)
            // Avoid creating too much rectangles
            this.area = new Mtk.Rectangle({
                x: anchor,
                y: 0,
                width: ICON_SIZE,
                height: ICON_SIZE,
            });
        return this.area;
    }

    _activateWorkspace(ws) {
        if (global.workspace_manager.get_active_workspace() === ws)
            Main.overview.toggle();
        else Main.overview.show();

        ws.activate(global.get_current_time());
    }

    _activateWindow(ws, w) {
        const is_active_ws =
            global.workspace_manager.get_active_workspace() === ws;

        if (is_active_ws && w.has_focus() && !Main.overview.visible)
            w.minimize();
        else w.activate(global.get_current_time());

        Main.overview.hide();
        if (!w.is_on_all_workspaces()) ws.activate(global.get_current_time());
    }

    _insert() {
        const box = Main.panel[this.side.box];
        box.insert_child_at_index(this.actor, this.side.index);
    }
}

export default class MinimizeShelfExtension extends Extension {
    enable() {
        this._side = new Direction(this.getSettings()).load();
        this._settingsChanged = this._side.settings.connect('changed', () =>
            this._reload()
        );

        this._windowList = new WindowList(this._side);
        this._windowList._insert();
    }

    disable() {
        this._side.settings.disconnect(this._settingsChanged);
        this._windowList._destroy();
        this._windowList = null;
        this._side = null;
    }

    _reload() {
        this._windowList._destroy();
        this._side.load();
        this._windowList = new WindowList(this._side);
        this._windowList._insert();
    }
}
