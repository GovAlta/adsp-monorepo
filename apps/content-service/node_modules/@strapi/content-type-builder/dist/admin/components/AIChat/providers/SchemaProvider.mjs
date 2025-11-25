import { jsx } from 'react/jsx-runtime';
import { useState, useEffect, createContext } from 'react';
import { useGuidedTour, GUIDED_TOUR_REQUIRED_ACTIONS } from '@strapi/admin/strapi-admin';
import { useDataManager } from '../../DataManager/useDataManager.mjs';
import { transformChatToCTB } from '../lib/transforms/schemas/toCTB.mjs';
import { useStrapiChat } from './ChatProvider.mjs';

const SchemaContext = /*#__PURE__*/ createContext(undefined);
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
    const [lastRevisedId, setLastRevisedId] = useState(null);
    const { messages, status } = useStrapiChat();
    const { contentTypes, components, applyChange } = useDataManager();
    const dispatch = useGuidedTour('SchemaChatProvider', (s)=>s.dispatch);
    const state = useGuidedTour('SchemaChatProvider', (s)=>s.state);
    useEffect(()=>{
        const latestMessage = messages[messages.length - 1];
        if (!latestMessage) return;
        if (latestMessage.role !== 'assistant') return;
        // Wait until message streaming has finished
        if (status !== 'ready') return;
        // const schemaChanges = latestMessage.schemaChanges;
        const schemaChanges = extractSchemaChangesFromMessage(latestMessage);
        // Check if addField action is already completed
        const isAddFieldCompleted = state.completedActions.includes(GUIDED_TOUR_REQUIRED_ACTIONS.contentTypeBuilder.addField);
        schemaChanges.forEach((change)=>{
            const oldSchema = contentTypes[change.schema.uid] || components[change.schema.uid];
            const newSchema = transformChatToCTB(change.schema, oldSchema);
            // Check if any attributes/fields are being added to any schema (existing or new)
            if (!isAddFieldCompleted && change.schema.attributes) {
                // If a field is being added or updated, dispatch guided tour action to show Save tooltip
                if (change.type !== 'remove' && Object.keys(change.schema.attributes).length > 0) {
                    dispatch({
                        type: 'set_completed_actions',
                        payload: [
                            GUIDED_TOUR_REQUIRED_ACTIONS.contentTypeBuilder.addField
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
    return /*#__PURE__*/ jsx(SchemaContext.Provider, {
        value: {
            lastRevisedId,
            setLastRevisedId
        },
        children: children
    });
};

export { SchemaChatProvider };
//# sourceMappingURL=SchemaProvider.mjs.map
