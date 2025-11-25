"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreAPI = exports.Config = void 0;
exports.Config = __importStar(require("./config"));
exports.CoreAPI = __importStar(require("./core-api"));
__exportStar(require("./container"), exports);
__exportStar(require("./controller"), exports);
__exportStar(require("./commands"), exports);
__exportStar(require("./middleware"), exports);
__exportStar(require("./policy"), exports);
__exportStar(require("./service"), exports);
__exportStar(require("./route"), exports);
__exportStar(require("./router"), exports);
__exportStar(require("./plugin"), exports);
__exportStar(require("./module"), exports);
__exportStar(require("./api"), exports);
__exportStar(require("./strapi"), exports);
//# sourceMappingURL=index.js.map