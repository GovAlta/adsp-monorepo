'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var slate = require('slate');
var slateReact = require('slate-react');
var styledComponents = require('styled-components');
var urls = require('../../../../../../utils/urls.js');
var BlocksEditor = require('../BlocksEditor.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const ImageWrapper = styledComponents.styled(designSystem.Flex)`
  transition-property: box-shadow;
  transition-duration: 0.2s;
  ${(props)=>props.$isFocused && styledComponents.css`
      box-shadow: ${props.theme.colors.primary600} 0px 0px 0px 3px;
    `}

  & > img {
    height: auto;
    // The max-height is decided with the design team, the 56px is the height of the toolbar
    max-height: calc(512px - 56px);
    max-width: 100%;
    object-fit: contain;
  }
`;
const IMAGE_SCHEMA_FIELDS = [
    'name',
    'alternativeText',
    'url',
    'caption',
    'width',
    'height',
    'formats',
    'hash',
    'ext',
    'mime',
    'size',
    'previewUrl',
    'provider',
    'provider_metadata',
    'createdAt',
    'updatedAt'
];
const pick = (object, keys)=>{
    const entries = keys.map((key)=>[
            key,
            object[key]
        ]);
    return Object.fromEntries(entries);
};
// Type guard to force TypeScript to narrow the type of the element in Blocks component
const isImage = (element)=>{
    return element.type === 'image';
};
// Added a background color to the image wrapper to make it easier to recognize the image block
const Image = ({ attributes, children, element })=>{
    const editorIsFocused = slateReact.useFocused();
    const imageIsSelected = slateReact.useSelected();
    if (!isImage(element)) {
        return null;
    }
    const { url, alternativeText, width, height } = element.image;
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
        ...attributes,
        children: [
            children,
            /*#__PURE__*/ jsxRuntime.jsx(ImageWrapper, {
                background: "neutral100",
                contentEditable: false,
                justifyContent: "center",
                $isFocused: editorIsFocused && imageIsSelected,
                hasRadius: true,
                children: /*#__PURE__*/ jsxRuntime.jsx("img", {
                    src: url,
                    alt: alternativeText,
                    width: width,
                    height: height
                })
            })
        ]
    });
};
const ImageDialog = ()=>{
    const [isOpen, setIsOpen] = React__namespace.useState(true);
    const { editor } = BlocksEditor.useBlocksEditorContext('ImageDialog');
    const components = strapiAdmin.useStrapiApp('ImageDialog', (state)=>state.components);
    if (!components || !isOpen) return null;
    const MediaLibraryDialog = components['media-library'];
    const insertImages = (images)=>{
        // If the selection is inside a list, split the list so that the modified block is outside of it
        slate.Transforms.unwrapNodes(editor, {
            match: (node)=>!slate.Editor.isEditor(node) && node.type === 'list',
            split: true
        });
        // Save the path of the node that is being replaced by an image to insert the images there later
        // It's the closest full block node above the selection
        const nodeEntryBeingReplaced = slate.Editor.above(editor, {
            match (node) {
                if (slate.Editor.isEditor(node)) return false;
                const isInlineNode = [
                    'text',
                    'link'
                ].includes(node.type);
                return !isInlineNode;
            }
        });
        if (!nodeEntryBeingReplaced) return;
        const [, pathToInsert] = nodeEntryBeingReplaced;
        // Remove the previous node that is being replaced by an image
        slate.Transforms.removeNodes(editor);
        // Convert images to nodes and insert them
        const nodesToInsert = images.map((image)=>{
            const imageNode = {
                type: 'image',
                image,
                children: [
                    {
                        type: 'text',
                        text: ''
                    }
                ]
            };
            return imageNode;
        });
        slate.Transforms.insertNodes(editor, nodesToInsert, {
            at: pathToInsert
        });
        // Set the selection on the image since it was cleared by calling removeNodes
        slate.Transforms.select(editor, pathToInsert);
    };
    const handleSelectAssets = (images)=>{
        const formattedImages = images.map((image)=>{
            // Create an object with imageSchema defined and exclude unnecessary props coming from media library config
            const expectedImage = pick(image, IMAGE_SCHEMA_FIELDS);
            const nodeImage = {
                ...expectedImage,
                alternativeText: expectedImage.alternativeText || expectedImage.name,
                url: urls.prefixFileUrlWithBackendUrl(image.url)
            };
            return nodeImage;
        });
        insertImages(formattedImages);
        setIsOpen(false);
    };
    return /*#__PURE__*/ jsxRuntime.jsx(MediaLibraryDialog, {
        allowedTypes: [
            'images'
        ],
        onClose: ()=>setIsOpen(false),
        onSelectAssets: handleSelectAssets
    });
};
const imageBlocks = {
    image: {
        renderElement: (props)=>/*#__PURE__*/ jsxRuntime.jsx(Image, {
                ...props
            }),
        icon: Icons.Image,
        label: {
            id: 'components.Blocks.blocks.image',
            defaultMessage: 'Image'
        },
        matchNode: (node)=>node.type === 'image',
        isInBlocksSelector: true,
        handleBackspaceKey (editor) {
            // Prevent issue where the image remains when it's the only block in the document
            if (editor.children.length === 1) {
                slate.Transforms.setNodes(editor, {
                    type: 'paragraph',
                    // @ts-expect-error we're only setting image as null so that Slate deletes it
                    image: null,
                    children: [
                        {
                            type: 'text',
                            text: ''
                        }
                    ]
                });
            } else {
                slate.Transforms.removeNodes(editor);
            }
        },
        handleEnterKey (editor) {
            slate.Transforms.insertNodes(editor, {
                type: 'paragraph',
                children: [
                    {
                        type: 'text',
                        text: ''
                    }
                ]
            });
        },
        handleConvert: ()=>{
            /**
       * All the logic is managed inside the ImageDialog component,
       * because the blocks are only created when the user selects images in the modal and submits
       * and if he closes the modal, then no changes are made to the editor
       */ return ()=>/*#__PURE__*/ jsxRuntime.jsx(ImageDialog, {});
        },
        snippets: [
            '!['
        ]
    }
};

exports.imageBlocks = imageBlocks;
//# sourceMappingURL=Image.js.map
