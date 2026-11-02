// SPDX-License-Identifier: GPL-3.0-only
// Copyright 2022 Baptiste Darthenay
// Copyright 2026 Chris Lottes

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { Direction } from './utils/settings.js';

export default class MinimizeShelfPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const side = new Direction(this.getSettings()).load();

        const toggles = {
            [side.Left]: Gtk.ToggleButton.new_with_label(side.label(side.Left)),
            [side.Right]: Gtk.ToggleButton.new_with_label(
                side.label(side.Right)
            ),
        };
        toggles[side.Right].set_group(toggles[side.Left]);
        toggles[side.value].set_active(true);

        const toggleDirection = widget => {
            if (widget.get_active()) side.save(side[widget.label]);
        };
        toggles[side.Left].connect('toggled', toggleDirection);
        toggles[side.Right].connect('toggled', toggleDirection);

        const buttons = new Gtk.Box({
            css_classes: ['linked'],
            valign: Gtk.Align.CENTER,
        });
        buttons.append(toggles[side.Left]);
        buttons.append(toggles[side.Right]);

        const row = new Adw.ActionRow({ title: 'Panel side' });
        row.add_suffix(buttons);

        const group = new Adw.PreferencesGroup();
        group.add(row);

        const page = new Adw.PreferencesPage();
        page.add(group);
        window.add(page);
    }
}
