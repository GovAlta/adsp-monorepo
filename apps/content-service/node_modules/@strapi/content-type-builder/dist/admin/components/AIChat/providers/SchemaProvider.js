'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var useDataManager = require('../../DataManager/useDataManager.js');
var toCTB = require('../lib/transforms/schemas/toCTB.js');
var ChatProvider = require('./ChatProvider.js');

const SchemaContext = /*#__PURE__*/ React.createContext(undefined);
const TYPE_TO_ACTION = {
    create: 'add',
    update: 'update',
    remove: 'delete'
};
function extractSchemaChangesFromMessage(message) {
    if (message.role !== 'assistant') return [];
    const changes = [];
    message.parts?.forEach((part, partIndex)=>{
        // We only care about the schema generation tool
        if (part && typeof part === 'object' && part.type === 'tool-schemaGenerationTool') {
            // Prefer validated schemas from output; ignore if there's an error or no output yet
            const output = part.output;
            if (!output || output.error || !Array.isArray(output.schemas)) return;
            const baseId = part.toolCallId ?? `${message.id}-${partIndex}`;
            output.schemas.forEach((schema, schemaIndex)=>{
                const revisionId = `${baseId}-${schema.uid ?? schema.name ?? schemaIndex}`;
                const type = schema.action || 'update';
                changes.push({
                    type,
                    schema,
                    revisionId
                });
            });
        }
    });
    return changes;
}
const SchemaChatProvider = ({ children })=>{
    const [lastRevisedId, setLastRevisedId] = React.useState(null);
    const { messages, status } = ChatProvider.useStrapiChat();
    const { contentTypes, components, applyChange } = useDataManager.useDataManager();
    const dispatch = strapiAdmin.useGuidedTour('SchemaChatProvider', (s)=>s.dispatch);
    const state = strapiAdmin.useGuidedTour('SchemaChatProvider', (s)=>s.state);
    React.useEffect(()=>{
        const latestMessage = messages[messages.length - 1];
        if (!latestMessage) return;
        if (latestMessage.role !== 'assistant') return;
        // Wait until message streaming has finished
        if (status !== 'ready') return;
        // const schemaChanges = latestMessage.schemaChanges;
        const schemaChanges = extractSchemaChangesFromMessage(latestMessage);
        // Check if addField action is already completed
        const isAddFieldCompleted = state.completedActions.includes(strapiAdmin.GUIDED_TOUR_REQUIRED_ACTIONS.contentTypeBuilder.addField);
        schemaChanges.forEach((change)=>{
            const oldSchema = contentTypes[change.schema.uid] || components[change.schema.uid];
            const newSchema = toCTB.transformChatToCTB(change.schema, oldSchema);
            // Check if any attributes/fields are being added to any schema (existing or new)
            if (!isAddFieldCompleted && change.schema.attributes) {
                // If a field is being added or updated, dispatch guided tour action to show Save tooltip
                if (change.type !== 'remove' && Object.keys(change.schema.attributes).length > 0) {
                    dispatch({
                        type: 'set_completed_actions',
                        payload: [
                            strapiAdmin.GUIDED_TOUR_REQUIRED_ACTIONS.contentTypeBuilder.addField
                        ]
                    });
                }
            }
            applyChange({
                action: TYPE_TO_ACTION[change.type],
                schema: newSchema
            });
        });
        setLastRevisedId(latestMessage.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        messages
    ]);
    return /*#__PURE__*/ jsxRuntime.jsx(SchemaContext.Provider, {
        value: {
            lastRevisedId,
            setLastRevisedId
        },
        children: children
    });
};

exports.SchemaChatProvider = SchemaChatProvider;
//# sourceMappingURL=SchemaProvider.js.map
