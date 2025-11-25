import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { Box, VisuallyHidden } from '@strapi/design-system';

// According to MDN
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState#value
const HAVE_FUTURE_DATA = 3;
const VideoPreview = ({ url, mime, onLoadDuration = ()=>{}, alt, ...props })=>{
    const handleTimeUpdate = (e)=>{
        if (e.currentTarget.currentTime > 0) {
            const video = e.currentTarget;
            const canvas = document.createElement('canvas');
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            video.replaceWith(canvas);
            onLoadDuration && onLoadDuration(video.duration);
        }
    };
    const handleThumbnailVisibility = (e)=>{
        const video = e.currentTarget;
        if (video.readyState < HAVE_FUTURE_DATA) return;
        video.play();
    };
    return /*#__PURE__*/ jsxs(Box, {
        tag: "figure",
        ...props,
        children: [
            /*#__PURE__*/ jsx("video", {
                muted: true,
                onLoadedData: handleThumbnailVisibility,
                src: url,
                crossOrigin: "anonymous",
                onTimeUpdate: handleTimeUpdate,
                children: /*#__PURE__*/ jsx("source", {
                    type: mime
                })
            }),
            /*#__PURE__*/ jsx(VisuallyHidden, {
                tag: "figcaption",
                children: alt
            })
        ]
    }, url);
};

export { VideoPreview };
//# sourceMappingURL=VideoPreview.mjs.map
