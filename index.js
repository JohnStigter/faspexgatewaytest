"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_gateway_sdk_js_1 = require("@ibm-aspera/http-gateway-sdk-js");
const FASPEX_GATEWAY_HOST = "https://filetransfer.ont.belastingdienst.nl";
let client;
function initHttpGateway() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            client = http_gateway_sdk_js_1.asperaHttpGateway;
            const gateway_url = `${FASPEX_GATEWAY_HOST}/aspera/http-gwy/v1/`;
            const response = yield client.initHttpGateway(gateway_url);
            console.log("HTTP Gateway SDK started", response);
        }
        catch (error) {
            console.warn("HTTP Gateway SDK did not start", error);
            process.exit();
        }
    });
}
initHttpGateway();
