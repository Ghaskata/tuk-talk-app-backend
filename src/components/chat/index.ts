import commonUtils from "../../utils/commonUtils";
import routeArray from "./routes";

export default (prefix: string) => commonUtils.routeArray(routeArray, prefix);
