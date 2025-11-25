'use strict';

var InjectionZone = require('./components/InjectionZone.js');
var plugin = require('./constants/plugin.js');
var DocumentActions = require('./pages/EditView/components/DocumentActions.js');
var Header = require('./pages/EditView/components/Header.js');
var Panels = require('./pages/EditView/components/Panels.js');
var Actions = require('./pages/ListView/components/BulkActions/Actions.js');
var TableActions = require('./pages/ListView/components/TableActions.js');

/* -------------------------------------------------------------------------------------------------
 * ContentManager plugin
 * -----------------------------------------------------------------------------------------------*/ class ContentManagerPlugin {
    addEditViewSidePanel(panels) {
        if (Array.isArray(panels)) {
            this.editViewSidePanels = [
                ...this.editViewSidePanels,
                ...panels
            ];
        } else if (typeof panels === 'function') {
            this.editViewSidePanels = panels(this.editViewSidePanels);
        } else {
            throw new Error(`Expected the \`panels\` passed to \`addEditViewSidePanel\` to be an array or a function, but received ${getPrintableType(panels)}`);
        }
    }
    addDocumentAction(actions) {
        if (Array.isArray(actions)) {
            this.documentActions = [
                ...this.documentActions,
                ...actions
            ];
        } else if (typeof actions === 'function') {
            this.documentActions = actions(this.documentActions);
        } else {
            throw new Error(`Expected the \`actions\` passed to \`addDocumentAction\` to be an array or a function, but received ${getPrintableType(actions)}`);
        }
    }
    addDocumentHeaderAction(actions) {
        if (Array.isArray(actions)) {
            this.headerActions = [
                ...this.headerActions,
                ...actions
            ];
        } else if (typeof actions === 'function') {
            this.headerActions = actions(this.headerActions);
        } else {
            throw new Error(`Expected the \`actions\` passed to \`addDocumentHeaderAction\` to be an array or a function, but received ${getPrintableType(actions)}`);
        }
    }
    addBulkAction(actions) {
        if (Array.isArray(actions)) {
            this.bulkActions = [
                ...this.bulkActions,
                ...actions
            ];
        } else if (typeof actions === 'function') {
            this.bulkActions = actions(this.bulkActions);
        } else {
            throw new Error(`Expected the \`actions\` passed to \`addBulkAction\` to be an array or a function, but received ${getPrintableType(actions)}`);
        }
    }
    get config() {
        return {
            id: plugin.PLUGIN_ID,
            name: 'Content Manager',
            injectionZones: InjectionZone.INJECTION_ZONES,
            apis: {
                addBulkAction: this.addBulkAction.bind(this),
                addDocumentAction: this.addDocumentAction.bind(this),
                addDocumentHeaderAction: this.addDocumentHeaderAction.bind(this),
                addEditViewSidePanel: this.addEditViewSidePanel.bind(this),
                getBulkActions: ()=>this.bulkActions,
                getDocumentActions: (position)=>{
                    /**
           * When possible, pre-filter the actions by the components static position property.
           * This avoids rendering the actions in multiple places where they weren't displayed,
           * which wasn't visible but created issues with useEffect for instance.
           * The response should still be filtered by the position, as the static property is new
           * and not mandatory to avoid a breaking change.
           */ if (position) {
                        return this.documentActions.filter((action)=>{
                            return action.position == undefined || [
                                action.position
                            ].flat().includes(position);
                        });
                    }
                    return this.documentActions;
                },
                getEditViewSidePanels: ()=>this.editViewSidePanels,
                getHeaderActions: ()=>this.headerActions
            }
        };
    }
    constructor(){
        /**
   * The following properties are the stored ones provided by any plugins registering with
   * the content-manager. The function calls however, need to be called at runtime in the
   * application, so instead we collate them and run them later with the complete list incl.
   * ones already registered & the context of the view.
   */ this.bulkActions = [
            ...Actions.DEFAULT_BULK_ACTIONS
        ];
        this.documentActions = [
            ...DocumentActions.DEFAULT_ACTIONS,
            ...TableActions.DEFAULT_TABLE_ROW_ACTIONS,
            ...Header.DEFAULT_HEADER_ACTIONS
        ];
        this.editViewSidePanels = [
            Panels.ActionsPanel
        ];
        this.headerActions = [];
    }
}
/* -------------------------------------------------------------------------------------------------
 * getPrintableType
 * -----------------------------------------------------------------------------------------------*/ /**
 * @internal
 * @description Gets the human-friendly printable type name for the given value, for instance it will yield
 * `array` instead of `object`, as the native `typeof` operator would do.
 */ const getPrintableType = (value)=>{
    const nativeType = typeof value;
    if (nativeType === 'object') {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (value instanceof Object && value.constructor.name !== 'Object') {
            return value.constructor.name;
        }
    }
    return nativeType;
};

exports.ContentManagerPlugin = ContentManagerPlugin;
//# sourceMappingURL=content-manager.js.map
