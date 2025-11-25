'use strict';

var React = require('react');
var Cropper = require('cropperjs');

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

const QUALITY = 1;
const useCropImg = ()=>{
    const cropperRef = React__namespace.useRef();
    const [isCropping, setIsCropping] = React__namespace.useState(false);
    const [size, setSize] = React__namespace.useState({
        width: undefined,
        height: undefined
    });
    React__namespace.useEffect(()=>{
        return ()=>{
            if (cropperRef.current) {
                cropperRef.current.destroy();
            }
        };
    }, []);
    const handleResize = ({ detail: { height, width } })=>{
        const roundedDataWidth = Math.round(width);
        const roundedDataHeight = Math.round(height);
        setSize({
            width: roundedDataWidth,
            height: roundedDataHeight
        });
    };
    const crop = (image)=>{
        if (!cropperRef.current) {
            cropperRef.current = new Cropper(image, {
                modal: true,
                initialAspectRatio: 16 / 9,
                movable: true,
                zoomable: false,
                cropBoxResizable: true,
                background: false,
                checkCrossOrigin: false,
                crop: handleResize
            });
            setIsCropping(true);
        }
    };
    const stopCropping = ()=>{
        if (cropperRef.current) {
            cropperRef.current.destroy();
            cropperRef.current = undefined;
            setIsCropping(false);
        }
    };
    const produceFile = (name, mimeType, lastModifiedDate)=>new Promise((resolve, reject)=>{
            if (!cropperRef.current) {
                reject(new Error('The cropper has not been instantiated: make sure to call the crop() function before calling produceFile().'));
            } else {
                const canvas = cropperRef.current.getCroppedCanvas();
                canvas.toBlob((blob)=>{
                    resolve(new File([
                        blob
                    ], name, {
                        type: mimeType,
                        lastModified: new Date(lastModifiedDate).getTime()
                    }));
                }, mimeType, QUALITY);
            }
        });
    return {
        crop,
        produceFile,
        stopCropping,
        isCropping,
        isCropperReady: Boolean(cropperRef.current),
        ...size
    };
};

exports.useCropImg = useCropImg;
//# sourceMappingURL=useCropImg.js.map
