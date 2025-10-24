import systemdBase from "./systemdBase";
import { enableSystemUnits, enableUnit } from "./systemdGenerator";


export default {
	...systemdBase,
	enableSystemUnits,
	enableUnit,
}