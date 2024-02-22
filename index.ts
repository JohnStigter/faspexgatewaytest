import { asperaHttpGateway } from "@ibm-aspera/http-gateway-sdk-js";
const FASPEX_GATEWAY_HOST = "https://filetransfer.ont.belastingdienst.nl";

let client: any;

async function initHttpGateway() {
  try {
    client = asperaHttpGateway;
    const gateway_url = `${FASPEX_GATEWAY_HOST}/aspera/http-gwy/v1/`;
    const response = await client.initHttpGateway(gateway_url);
    console.log("HTTP Gateway SDK started", response);
  } catch (error) {
    console.warn("HTTP Gateway SDK did not start", error);
    process.exit();
  }
}

initHttpGateway();
