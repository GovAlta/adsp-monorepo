"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.adapter = void 0;
var path = __importStar(require("path"));
var os_paths_1 = __importDefault(require("os-paths"));
exports.adapter = {
    atImportPermissions: { env: true },
    env: {
        get: function (s) {
            return process.env[s];
        }
    },
    osPaths: os_paths_1["default"],
    path: path,
    process: process
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9wbGF0Zm9ybS1hZGFwdGVycy9ub2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx5Q0FBNkI7QUFFN0Isc0RBQStCO0FBSWxCLFFBQUEsT0FBTyxHQUFxQjtJQUN4QyxtQkFBbUIsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUU7SUFDbEMsR0FBRyxFQUFFO1FBQ0osR0FBRyxFQUFFLFVBQUMsQ0FBQztZQUVOLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QixDQUFDO0tBQ0Q7SUFDRCxPQUFPLHVCQUFBO0lBQ1AsSUFBSSxNQUFBO0lBQ0osT0FBTyxTQUFBO0NBQ1AsQ0FBQyJ9