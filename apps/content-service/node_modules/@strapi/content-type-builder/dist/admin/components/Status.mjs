import { jsx } from 'react/jsx-runtime';
import { Typography, Badge } from '@strapi/design-system';

const Status = ({ status })=>{
    switch(status){
        case 'UNCHANGED':
            return null;
        case 'CHANGED':
            return /*#__PURE__*/ jsx(Typography, {
                fontWeight: "semiBold",
                textColor: "alternative500",
                children: "M"
            });
        case 'REMOVED':
            return /*#__PURE__*/ jsx(Typography, {
                fontWeight: "semiBold",
                textColor: "danger500",
                children: "D"
            });
        case 'NEW':
            return /*#__PURE__*/ jsx(Typography, {
                fontWeight: "semiBold",
                textColor: "success500",
                children: "N"
            });
    }
};
const StatusBadge = ({ status })=>{
    switch(status){
        case 'CHANGED':
            return /*#__PURE__*/ jsx(Badge, {
                fontWeight: "bold",
                textColor: "alternative600",
                backgroundColor: "alternative100",
                borderColor: "alternative200",
                children: "Modified"
            });
        case 'REMOVED':
            return /*#__PURE__*/ jsx(Badge, {
                fontWeight: "bold",
                textColor: "danger600",
                backgroundColor: "danger100",
                borderColor: "danger200",
                children: "Deleted"
            });
        case 'NEW':
            return /*#__PURE__*/ jsx(Badge, {
                fontWeight: "bold",
                textColor: "success600",
                backgroundColor: "success100",
                borderColor: "success200",
                children: "New"
            });
        case 'UNCHANGED':
        default:
            return /*#__PURE__*/ jsx(Badge, {
                style: {
                    visibility: 'hidden'
                },
                fontWeight: "bold",
                textColor: "warning600",
                backgroundColor: "warning100",
                borderColor: "warning200",
                children: "Unchanged"
            });
    }
};

export { Status, StatusBadge };
//# sourceMappingURL=Status.mjs.map
