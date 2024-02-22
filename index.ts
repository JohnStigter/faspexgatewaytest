import { asperaHttpGateway } from "@ibm-aspera/http-gateway-sdk-js";
import { HttpGateway } from "@ibm-aspera/http-gateway-sdk-js/commonjs/models/http-gateway-global.model";
const FASPEX_GATEWAY_HOST = "https://filetransfer.ont.belastingdienst.nl";
const BEARER_TOKEN =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6IiIsImV4cCI6MTcwODY1MzA0MywiYXVkIjoiMTQxMjk4NTgtNDQxMi00M2E4LTgxMDMtMTFhZjFmMmVkOWY4IiwianRpIjoiMjAzMDQ5IiwiaWF0IjoxNzA4NjA5ODQzLCJzdWIiOiJ1c2VyOjIiLCJuYW1lIjoiQlRBZG1pbiIsImVtYWlsIjoiZmlsZXRyYW5zZmVyQGJlbGFzdGluZ2RpZW5zdC5ubCJ9.mr2Mp17CVkAuYk7tp4XJtre_9S2XqKi9ZZY92ZDe2NWJ6HH5gfHrx6HL3paAbQoLodUUFmzfpGOvmilvYJgh7yS3c3BQpX463rkfp5e8mbEshQnHa_YAUt1GgabPR5iUrplKPLoDceRDwX8HIS6G2WiLxn4kkCmWS15tSNenDuQV393ddKoayjhNasuBLcF2y72ywqo9fL10UheLGq_8S7eEcXjckxj7jbxoMMePaA8v5M-MGf8GZDb3dIz-TK6tnzaANGckUP6V_sGKMTe6fuNqoQRdTqbbo3TB3uLFNbysAC0RphM3KsI4J6o9LvjEO8AuAdUkRQGi5z32IjUFqQ";

class Faspex5Service {
  client: HttpGateway | undefined;
  files = [{ name: "./package.json" }];
  constructor() {}
  private async setHeaders(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    accept: "application/json" | "" = "",
    content: "application/json" | "" = "",
    withToken = true
  ): Promise<any> {
    try {
      const reqOptions: {
        method: string;
        headers: { [key: string]: any };
        agent?: any;
        body?: any;
      } = { method: method, headers: { accept: accept } };
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
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  async initHttpGateway() {
    try {
      this.client = asperaHttpGateway;
      const gateway_url = `${FASPEX_GATEWAY_HOST}/aspera/http-gwy/v1/`;
      const response = await this.client.initHttpGateway(gateway_url, true);
      console.log("HTTP Gateway SDK started", response);
      return;
    } catch (error) {
      console.warn("HTTP Gateway SDK did not start", error);
      process.exit();
    }
  }

  monitorTransfers(result: any) {
    result.transfers.forEach((transfer: any) => {
      console.log(
        `New Transfer:
  - Percent: ${transfer.percent * 100}%,
  - Status: ${transfer.status},
  - Data Sent: ${transfer.bytes_written},
  - Data Total: ${transfer.bytes_expected}
  `
      );
    });
    console.log("Transfer completed");
  }

  async fetchTransferSpec(
    packageId: string,
    filepaths: any,
    bearerToken: string
  ) {
    // Retrieve upload transfer specification for HTTP Gateway
    const ts_url = `${FASPEX_GATEWAY_HOST}/aspera/faspex/api/v5/packages/${packageId}/transfer_spec/upload?transfer_type=http_gateway`;
    const ts_response = await fetch(ts_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(filepaths),
    });
    let ts_data = await ts_response.json();

    console.log("Transfer specification", ts_data);

    // If successful, Faspex returns a transfer specification
    return ts_data;
  }
  async upload(packageId: string, bearerToken: string) {
    if (this.client) {
      this.client.registerActivityCallback(this.monitorTransfers);
      console.log("Registered callback to monitor transfers");
      if (this.files.length === 1) {
        let fileToUpload = this.files[0].name;
        const filepaths = {
          paths: [fileToUpload],
        };
        this.fetchTransferSpec(packageId, filepaths, bearerToken).then(
          (transferSpec) => {
            this.client!.upload(transferSpec, packageId)
              .then((response) => {
                console.log("Upload started", response);
              })
              .catch((error) => {
                console.log("Upload could not start", error);
              });
          }
        );
      }
    }
  }
  async createPackage(title: string, recipients: string[]): Promise<any> {
    try {
      const reqOptions = await this.setHeaders(
        "POST",
        "application/json",
        "application/json",
        true
      );
      const url = `${FASPEX_GATEWAY_HOST}/aspera/faspex/api/v5/packages`;
      const faspexRecipientsObject: { name: string }[] = [];
      for (const recipient of recipients) {
        faspexRecipientsObject.push({ name: recipient });
      }
      reqOptions.body = JSON.stringify({
        title: title,
        recipients: faspexRecipientsObject,
      });
      const result = await fetch(url, reqOptions);
      console.log(`Fetch result ${JSON.stringify(result)}`);
      const resultJSON = await result.json();
      console.log(
        `result from create package request${JSON.stringify(resultJSON)}`
      );
      return resultJSON;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
(async () => {
  try {
    const faspex5ServiceInstance = new Faspex5Service();
    await faspex5ServiceInstance.initHttpGateway();
    const newPackage = await faspex5ServiceInstance.createPackage(
      "Gatewaytest",
      ["john.stigter@icloud.com"]
    );
    const transferSpec = await faspex5ServiceInstance.upload(newPackage.id, BEARER_TOKEN);
  } catch (error) {
    console.error(error);
    process.exit();
  }
})();
