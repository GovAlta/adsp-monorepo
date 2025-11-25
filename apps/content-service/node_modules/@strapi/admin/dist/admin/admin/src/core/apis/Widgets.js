'use strict';

var invariant = require('invariant');

class Widgets {
    register(widgets) {
        if (Array.isArray(widgets)) {
            this.checkWidgets(widgets);
            this.widgets = [
                ...this.widgets,
                ...widgets
            ];
        } else if (typeof widgets === 'function') {
            const newWidgets = widgets(this.widgets);
            this.checkWidgets(newWidgets);
            this.widgets = newWidgets;
        } else if (typeof widgets === 'object') {
            this.checkWidgets([
                widgets
            ]);
            this.widgets.push(widgets);
        } else {
            throw new Error('Expected widgets to be an array or a reducer function');
        }
    }
    constructor(){
        this.generateUid = (widget)=>{
            return widget.pluginId ? `plugin::${widget.pluginId}.${widget.id}` : `global::${widget.id}`;
        };
        this.checkWidgets = (widgets)=>{
            widgets.forEach((widget)=>{
                invariant(widget.id, 'An id must be provided');
                invariant(widget.component, 'A component must be provided');
                invariant(widget.title, 'A title must be provided');
                invariant(widget.icon, 'An icon must be provided');
            });
        };
        this.getAll = ()=>{
            return this.widgets.map((widget)=>{
                const { id, pluginId, ...widgetBase } = widget;
                return {
                    ...widgetBase,
                    uid: this.generateUid(widget)
                };
            });
        };
        this.widgets = [];
    }
}

exports.Widgets = Widgets;
//# sourceMappingURL=Widgets.js.map
