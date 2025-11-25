"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin_1 = __importDefault(require("./admin"));
exports.default = {
    admin: admin_1.default,
    'content-api': {
        type: 'content-api',
        routes: [
            {
                method: 'GET',
                path: '/',
                // name of the controller file & the method.
                handler: 'controller.index',
                config: {
                    policies: [],
                },
            },
        ],
    },
};
//# sourceMappingURL=index.js.map