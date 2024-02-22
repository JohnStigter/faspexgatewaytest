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
const FASPEX_HOST = "https://filetransfer.ont.belastingdienst.nl";
const BEARER_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6IiIsImV4cCI6MTcwODY1MzA0MywiYXVkIjoiMTQxMjk4NTgtNDQxMi00M2E4LTgxMDMtMTFhZjFmMmVkOWY4IiwianRpIjoiMjAzMDQ5IiwiaWF0IjoxNzA4NjA5ODQzLCJzdWIiOiJ1c2VyOjIiLCJuYW1lIjoiQlRBZG1pbiIsImVtYWlsIjoiZmlsZXRyYW5zZmVyQGJlbGFzdGluZ2RpZW5zdC5ubCJ9.mr2Mp17CVkAuYk7tp4XJtre_9S2XqKi9ZZY92ZDe2NWJ6HH5gfHrx6HL3paAbQoLodUUFmzfpGOvmilvYJgh7yS3c3BQpX463rkfp5e8mbEshQnHa_YAUt1GgabPR5iUrplKPLoDceRDwX8HIS6G2WiLxn4kkCmWS15tSNenDuQV393ddKoayjhNasuBLcF2y72ywqo9fL10UheLGq_8S7eEcXjckxj7jbxoMMePaA8v5M-MGf8GZDb3dIz-TK6tnzaANGckUP6V_sGKMTe6fuNqoQRdTqbbo3TB3uLFNbysAC0RphM3KsI4J6o9LvjEO8AuAdUkRQGi5z32IjUFqQ";
class Faspex5Service {
    constructor() {
        this.files = [{ name: "./package.json" }];
    }
    setHeaders(method, accept = "", content = "", withToken = true) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const reqOptions = { method: method, headers: { accept: accept } };
                if (accept) {
                    reqOptions.headers["Accept"] = accept;
                }
                if (content) {
                    reqOptions.headers["Content-Type"] = content;
                }
                if (withToken) {
                    reqOptions.headers["Authorization"] = `Bearer ${BEARER_TOKEN}`;
                }
                return reqOptions;
            }
            catch (error) {
                console.error(error);
                throw error;
            }
        });
    }
    initHttpGateway() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.client = http_gateway_sdk_js_1.asperaHttpGateway;
                const gateway_url = `${FASPEX_GATEWAY_HOST}/aspera/http-gwy/v1/`;
                const response = yield this.client.initHttpGateway(gateway_url, true);
                console.log("HTTP Gateway SDK started", response);
                return;
            }
            catch (error) {
                console.warn("HTTP Gateway SDK did not start", error);
                process.exit();
            }
        });
    }
    monitorTransfers(result) {
        result.transfers.forEach((transfer) => {
            console.log(`New Transfer:
  - Percent: ${transfer.percent * 100}%,
  - Status: ${transfer.status},
  - Data Sent: ${transfer.bytes_written},
  - Data Total: ${transfer.bytes_expected}
  `);
        });
        console.log("Transfer completed");
    }
    fetchTransferSpec(packageId, filepaths, bearerToken) {
        return __awaiter(this, void 0, void 0, function* () {
            // Retrieve upload transfer specification for HTTP Gateway
            const ts_url = `${FASPEX_GATEWAY_HOST}/aspera/faspex/api/v5/packages/${packageId}/transfer_spec/upload?transfer_type=http_gateway`;
            const ts_response = yield fetch(ts_url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${bearerToken}`,
                },
                body: JSON.stringify(filepaths),
            });
            let ts_data = yield ts_response.json();
            console.log("Transfer specification", ts_data);
            // If successful, Faspex returns a transfer specification
            return ts_data;
        });
    }
    upload(packageId, bearerToken) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.client) {
                this.client.registerActivityCallback(this.monitorTransfers);
                console.log("Registered callback to monitor transfers");
                if (this.files.length === 1) {
                    let fileToUpload = this.files[0].name;
                    const filepaths = {
                        paths: [fileToUpload],
                    };
                    this.fetchTransferSpec(packageId, filepaths, bearerToken).then((transferSpec) => {
                        this.client.upload(transferSpec, packageId)
                            .then((response) => {
                            console.log("Upload started", response);
                        })
                            .catch((error) => {
                            console.log("Upload could not start", error);
                        });
                    });
                }
            }
        });
    }
    createPackage(title, recipients) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const reqOptions = yield this.setHeaders("POST", "application/json", "application/json", true);
                const url = `${FASPEX_HOST}/aspera/faspex/api/v5/packages`;
                const faspexRecipientsObject = [];
                for (const recipient of recipients) {
                    faspexRecipientsObject.push({ name: recipient });
                }
                reqOptions.body = JSON.stringify({
                    title: title,
                    recipients: faspexRecipientsObject,
                });
                const result = yield fetch(url, reqOptions);
                console.log(`Fetch result ${JSON.stringify(result)}`);
                const resultJSON = yield result.json();
                console.log(`result from create package request${JSON.stringify(resultJSON)}`);
                return resultJSON;
            }
            catch (error) {
                console.error(error);
                throw error;
            }
        });
    }
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const faspex5ServiceInstance = new Faspex5Service();
        yield faspex5ServiceInstance.initHttpGateway();
        const newPackage = yield faspex5ServiceInstance.createPackage("Gatewaytest", ["john.stigter@icloud.com"]);
        const transferSpec = yield faspex5ServiceInstance.upload(newPackage.id, BEARER_TOKEN);
    }
    catch (error) {
        console.error(error);
        process.exit();
    }
}))();
